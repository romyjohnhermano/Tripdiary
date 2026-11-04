import Link from "next/link";
import Nav from "@/components/Nav";
import { db } from "@/lib/db";
import { requireMe } from "@/lib/session";
import { APPEALABLE, MAX_APPEAL_LENGTH, REACTIONS, preview } from "@/lib/moderation";
import { timeAgo } from "@/lib/util";
import { appeal } from "../actions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const me = await requireMe();
  const { data: notes } = await db.from("notification").select("*, actor:actor_id(username)")
    .eq("student_id", me.id).order("notification_id", { ascending: false }).limit(100);
  const list = notes || [];
  const postIds = [...new Set(list.map((n) => n.post_id).filter(Boolean))] as number[];
  const { data: posts } = postIds.length ? await db.from("post").select("post_id, description, image").in("post_id", postIds) : { data: [] as any[] };
  const { data: appeals } = list.length
    ? await db.from("appeal").select("notification_id, status, admin_note").in("notification_id", list.map((n) => n.notification_id)) : { data: [] as any[] };

  // Opening the page means they've been read (the unread badge was already counted above)
  await db.from("notification").update({ is_read: true }).eq("student_id", me.id).eq("is_read", false);

  return (
    <>
      <Nav />
      <main>
        <h1>Notifications</h1>
        <p className="muted">Reactions, comments, replies and reposts of your posts, and updates from the admin.</p>
        <div className="card">
          {list.length === 0 && <p className="muted">Nothing yet.</p>}
          {list.map((n) => {
            const p = posts?.find((x) => x.post_id === n.post_id);
            const title = p ? preview(p.description, p.image) : "a post";
            const who = n.actor?.username ?? "Someone";
            const ap = appeals?.find((a) => a.notification_id === n.notification_id);
            const canAppeal = n.type === "admin" && n.action && n.action in APPEALABLE && !ap;
            return (
              <div key={n.notification_id} className={`list-row${n.is_read ? "" : " unread"}`} style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  {n.type === "admin" ? <span>🛡️ {n.message}</span> : (
                    <Link href={`/feed#post-${n.post_id}`}>
                      <b>{who}</b>{" "}
                      {n.type === "reaction" && <>reacted “{REACTIONS[n.reaction_type]?.label ?? n.reaction_type}” to</>}
                      {n.type === "comment" && <>commented on</>}
                      {n.type === "reply" && <>replied to your comment on</>}
                      {n.type === "repost" && <>reposted</>} your post “{title}”
                    </Link>
                  )}
                  {n.admin_note && <p className="muted small">Admin note: {n.admin_note}</p>}
                  {ap?.status === "pending" && <p className="notice small">⏳ You asked to get it back. An admin will review it within 5–10 hours.</p>}
                  {ap?.status === "accepted" && <p className="small" style={{ color: "var(--ok)" }}>✓ Your appeal was accepted.</p>}
                  {ap?.status === "declined" && <p className="muted small">Your appeal was reviewed. The decision stays.</p>}
                  {canAppeal && (
                    <details><summary>Ask to get it back</summary>
                      <form action={appeal}>
                        <input type="hidden" name="notificationId" value={n.notification_id} />
                        <textarea name="message" required maxLength={MAX_APPEAL_LENGTH} placeholder="Tell the admin why it should come back…" />
                        <button className="button small">Send appeal</button>
                      </form>
                    </details>
                  )}
                </div>
                <span className="muted small">{timeAgo(n.created_at)}</span>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
