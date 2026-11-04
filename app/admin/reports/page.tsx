import AdminShell from "@/components/AdminShell";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { censor } from "@/lib/moderation";
import { imgUrl, timeAgo } from "@/lib/util";
import { adminDismissChatReport, adminKeepContent, adminRemoveContent } from "../../actions";

export const dynamic = "force-dynamic";

function Decision({ postId, commentId }: { postId?: number; commentId?: number }) {
  const ids = (<>{postId && <input type="hidden" name="postId" value={postId} />}{commentId && <input type="hidden" name="commentId" value={commentId} />}<input type="hidden" name="back" value="/admin/reports" /></>);
  return (
    <div className="actions">
      <form action={adminRemoveContent}>{ids}<input name="note" maxLength={300} placeholder="Note to the student (optional)" /><button className="button danger small" style={{ marginTop: 6 }}>Remove</button></form>
      <form action={adminKeepContent}>{ids}<button className="button ghost small">Keep (dismiss reports)</button></form>
    </div>
  );
}

export default async function AdminReports() {
  await requireAdmin();
  const { data: reports } = await db.from("report").select("*, reporter:student_id(username)").order("report_id", { ascending: false });
  const postIds = [...new Set((reports || []).filter((r) => !r.comment_id && r.post_id).map((r) => r.post_id))] as number[];
  const commentIds = [...new Set((reports || []).filter((r) => r.comment_id).map((r) => r.comment_id))] as number[];
  const [{ data: posts }, { data: comments }, { data: chats }] = await Promise.all([
    postIds.length ? db.from("post").select("*, student:student_id(username)").in("post_id", postIds).eq("removed", false) : Promise.resolve({ data: [] as any[] }),
    commentIds.length ? db.from("comment").select("*, student:student_id(username)").in("comment_id", commentIds).eq("removed", false) : Promise.resolve({ data: [] as any[] }),
    db.from("message_report").select("*, reporter:reporter_id(username), reported:reported_id(username)").order("report_id", { ascending: false }),
  ]);

  return (
    <AdminShell>
      <h1>Reports</h1>
      <h2>Posts</h2>
      {!posts?.length && <p className="muted">No reported posts.</p>}
      {posts?.map((p) => {
        const rs = (reports || []).filter((r) => r.post_id === p.post_id && !r.comment_id);
        return (
          <div key={p.post_id} className="card">
            <b>{p.is_anonymous ? `${p.student?.username} (posted anonymously)` : p.student?.username}</b> · <span className="muted small">{timeAgo(p.created_at)} · {rs.length} report(s)</span>
            <p style={{ whiteSpace: "pre-wrap" }}>{censor(p.description)}</p>
            {p.image && <img className="post-img" src={imgUrl(p.image)!} alt="" />}
            <ul className="small muted">{rs.map((r) => <li key={r.report_id}>{r.reason}{r.details ? ` — ${r.details}` : ""} (by {r.reporter?.username})</li>)}</ul>
            <Decision postId={p.post_id} />
          </div>
        );
      })}
      <h2>Comments</h2>
      {!comments?.length && <p className="muted">No reported comments.</p>}
      {comments?.map((c) => {
        const rs = (reports || []).filter((r) => r.comment_id === c.comment_id);
        return (
          <div key={c.comment_id} className="card">
            <b>{c.student?.username}</b> · <span className="muted small">{rs.length} report(s)</span>
            <p>{c.text}</p>
            <ul className="small muted">{rs.map((r) => <li key={r.report_id}>{r.reason}{r.details ? ` — ${r.details}` : ""}</li>)}</ul>
            <Decision commentId={c.comment_id} />
          </div>
        );
      })}
      <h2>Conversations</h2>
      {!chats?.length && <p className="muted">No reported conversations.</p>}
      {chats?.map((r) => (
        <div key={r.report_id} className="card">
          <b>{r.reporter?.username}</b> reported <b>{r.reported?.username}</b> · <span className="muted small">{timeAgo(r.created_at)}</span>
          <p>{r.reason}{r.details ? ` — ${r.details}` : ""}</p>
          <form action={adminDismissChatReport}><input type="hidden" name="reportId" value={r.report_id} /><button className="button ghost small">Dismiss</button></form>
        </div>
      ))}
    </AdminShell>
  );
}
