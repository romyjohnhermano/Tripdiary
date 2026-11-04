import { db } from "./db";
import { HIDE_AFTER_REPORTS, PHOTO_REASON } from "./moderation";

export type CommentT = {
  comment_id: number; post_id: number; parent_id: number | null; student_id: number; text: string; created_at: string;
  username: string; profile_pic: string | null; hidden: boolean; reported_by_me: boolean; replies: CommentT[];
};
export type PostT = {
  post_id: number; student_id: number | null; description: string; feeling: string | null; image: string | null;
  is_anonymous: boolean; created_at: string; username: string | null; profile_pic: string | null;
  hidden: boolean; reported_by_me: boolean; reactions: Record<string, number>; mine: string | null;
  repost_count: number; reposted_by_me: boolean; comments: CommentT[];
};

// Loads posts with their comments, reactions and reposts, applying the same hiding rules as the PHP app:
// removed posts never show; posts/comments with 3+ reports only show to their own writer.
export async function loadPosts(meId: number | null, opts: { studentId?: number; postId?: number } = {}): Promise<PostT[]> {
  let q = db.from("post").select("*, student:student_id(username, profile_pic)").eq("removed", false)
    .order("post_id", { ascending: false }).limit(100);
  if (opts.studentId) q = q.eq("student_id", opts.studentId);
  if (opts.postId) q = q.eq("post_id", opts.postId);
  const { data: rows } = await q;
  if (!rows?.length) return [];
  const ids = rows.map((r: any) => r.post_id);

  const [{ data: reps }, { data: coms }, { data: reacts }, { data: reposts }] = await Promise.all([
    db.from("report").select("post_id, comment_id, student_id, reason").in("post_id", ids),
    db.from("comment").select("*, student:student_id(username, profile_pic)").in("post_id", ids).eq("removed", false).order("comment_id"),
    db.from("reaction").select("post_id, student_id, type").in("post_id", ids),
    db.from("repost").select("post_id, student_id").in("post_id", ids),
  ]);

  const commentIds = (coms || []).map((c: any) => c.comment_id);
  const { data: creps } = commentIds.length
    ? await db.from("report").select("comment_id, student_id").in("comment_id", commentIds)
    : { data: [] as any[] };

  const posts = new Map<number, PostT>();
  for (const r of rows as any[]) {
    const pr = (reps || []).filter((x: any) => x.post_id === r.post_id && !x.comment_id);
    const count = pr.filter((x: any) => x.reason !== PHOTO_REASON).length;
    const hidden = count >= HIDE_AFTER_REPORTS;
    if (hidden && r.student_id !== meId) continue;
    const pReacts = (reacts || []).filter((x: any) => x.post_id === r.post_id);
    const reactions: Record<string, number> = { hug: 0, support: 0, strength: 0 };
    pReacts.forEach((x: any) => { reactions[x.type] = (reactions[x.type] || 0) + 1; });
    const rp = (reposts || []).filter((x: any) => x.post_id === r.post_id);
    posts.set(r.post_id, {
      post_id: r.post_id, student_id: r.student_id, description: r.description, feeling: r.feeling, image: r.image,
      is_anonymous: r.is_anonymous, created_at: r.created_at, username: r.student?.username ?? null,
      profile_pic: r.student?.profile_pic ?? null, hidden,
      reported_by_me: !!meId && pr.some((x: any) => x.student_id === meId),
      reactions, mine: pReacts.find((x: any) => x.student_id === meId)?.type ?? null,
      repost_count: rp.length, reposted_by_me: !!meId && rp.some((x: any) => x.student_id === meId), comments: [],
    });
  }

  const visible = new Map<number, CommentT>();
  for (const c of (coms || []) as any[]) {
    const cr = (creps || []).filter((x: any) => x.comment_id === c.comment_id);
    const hidden = cr.length >= HIDE_AFTER_REPORTS;
    if (hidden && c.student_id !== meId) continue;
    visible.set(c.comment_id, {
      comment_id: c.comment_id, post_id: c.post_id, parent_id: c.parent_id, student_id: c.student_id, text: c.text,
      created_at: c.created_at, username: c.student?.username ?? "Someone", profile_pic: c.student?.profile_pic ?? null,
      hidden, reported_by_me: !!meId && cr.some((x: any) => x.student_id === meId), replies: [],
    });
  }
  for (const c of visible.values()) if (c.parent_id && visible.has(c.parent_id)) visible.get(c.parent_id)!.replies.push(c);
  for (const c of visible.values()) if (!c.parent_id) posts.get(c.post_id)?.comments.push(c);

  return [...posts.values()];
}

export async function isBlockedBetween(a: number, b: number) {
  const { data } = await db.from("block").select("blocker_id")
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`);
  return { iBlocked: !!data?.some((x) => x.blocker_id === a), blockedMe: !!data?.some((x) => x.blocker_id === b) };
}
