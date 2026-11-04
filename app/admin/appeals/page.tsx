import AdminShell from "@/components/AdminShell";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { APPEALABLE } from "@/lib/moderation";
import { timeAgo } from "@/lib/util";
import { adminDecideAppeal } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminAppeals() {
  await requireAdmin();
  const { data } = await db.from("appeal").select("*, student:student_id(username)").eq("status", "pending").order("appeal_id");
  const postIds = (data || []).map((a) => a.post_id).filter(Boolean) as number[];
  const commentIds = (data || []).map((a) => a.comment_id).filter(Boolean) as number[];
  const { data: posts } = postIds.length ? await db.from("post").select("post_id, description").in("post_id", postIds) : { data: [] as any[] };
  const { data: comments } = commentIds.length ? await db.from("comment").select("comment_id, text").in("comment_id", commentIds) : { data: [] as any[] };
  return (
    <AdminShell>
      <h1>Appeals</h1>
      {!data?.length && <p className="muted">No pending appeals.</p>}
      {data?.map((a) => (
        <div key={a.appeal_id} className="card">
          <b>{a.student?.username}</b> · <span className="muted small">{APPEALABLE[a.action]} · {timeAgo(a.created_at)}</span>
          <p className="muted">Content: “{a.comment_id ? comments?.find((c) => c.comment_id === a.comment_id)?.text : posts?.find((p) => p.post_id === a.post_id)?.description}”</p>
          <p>Their message: {a.message}</p>
          <form action={adminDecideAppeal}>
            <input type="hidden" name="appealId" value={a.appeal_id} />
            <input name="note" maxLength={300} placeholder="Note to the student (optional)" />
            <div className="actions"><button name="decision" value="accept" className="button small">Accept (bring it back)</button><button name="decision" value="decline" className="button ghost small">Decline</button></div>
          </form>
        </div>
      ))}
    </AdminShell>
  );
}
