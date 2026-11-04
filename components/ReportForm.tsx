import { reportContent } from "@/app/actions";
import { REPORT_REASONS } from "@/lib/moderation";

export default function ReportForm({ postId, commentId, back, done }: { postId: number; commentId?: number; back: string; done: boolean }) {
  if (done) return <span className="muted small">Reported</span>;
  return (
    <details className="report">
      <summary>Report</summary>
      <form action={reportContent}>
        <input type="hidden" name="postId" value={postId} />
        {commentId && <input type="hidden" name="commentId" value={commentId} />}
        <input type="hidden" name="back" value={back} />
        <select name="reason" required defaultValue="">
          <option value="" disabled>Why?</option>
          {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input name="details" maxLength={300} placeholder="Tell us more (needed for Other)" />
        <button className="button small">Send report</button>
      </form>
    </details>
  );
}
