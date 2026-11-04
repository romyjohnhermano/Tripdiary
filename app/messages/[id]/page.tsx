import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import ChatRefresh from "@/components/ChatRefresh";
import { db } from "@/lib/db";
import { requireMe } from "@/lib/session";
import { isBlockedBetween } from "@/lib/queries";
import { blockUser, reportConversation, sendMessage, unblockUser } from "../../actions";
import { REPORT_REASONS } from "@/lib/moderation";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMe();
  const otherId = Number((await params).id);
  if (!otherId || otherId === me.id) notFound();
  const { data: other } = await db.from("student").select("student_id, username, profile_pic").eq("student_id", otherId).maybeSingle();
  if (!other) notFound();

  const { data: rows } = await db.from("message").select("*")
    .or(`and(sender_id.eq.${me.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me.id})`)
    .order("message_id", { ascending: false }).limit(200);
  const messages = (rows || []).reverse();
  await db.from("message").update({ is_read: true }).eq("sender_id", otherId).eq("receiver_id", me.id).eq("is_read", false);
  const block = await isBlockedBetween(me.id, otherId);
  const back = `/messages/${otherId}`;

  return (
    <>
      <Nav />
      <ChatRefresh />
      <div className="page">
        <div className="page-head">
          <Link href={`/profile/${otherId}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Avatar name={other.username} pic={other.profile_pic} /> <h2 style={{ margin: 0 }}>{other.username}</h2>
          </Link>
          <div className="actions">
            <form action={block.iBlocked ? unblockUser : blockUser}>
              <input type="hidden" name="other" value={otherId} /><input type="hidden" name="back" value={back} />
              <button className="button ghost small">{block.iBlocked ? "Unblock" : "Block"}</button>
            </form>
            <details className="report">
              <summary>Report</summary>
              <form action={reportConversation}>
                <input type="hidden" name="other" value={otherId} /><input type="hidden" name="back" value={back} />
                <select name="reason" required defaultValue=""><option value="" disabled>Why?</option>{REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                <input name="details" maxLength={300} placeholder="Tell us more" />
                <button className="button small">Send report</button>
              </form>
            </details>
          </div>
        </div>

        <div className="chat">
          {messages.length === 0 && <p className="muted">Say hi 👋</p>}
          {messages.map((m) => <div key={m.message_id} className={`bubble${m.sender_id === me.id ? " me" : ""}`}>{m.text}</div>)}
        </div>

        {block.iBlocked || block.blockedMe ? (
          <p className="notice">{block.iBlocked ? "You blocked this person. Unblock to message them." : "You can't message this person."}</p>
        ) : (
          <form action={sendMessage} className="comment-form">
            <input type="hidden" name="to" value={otherId} />
            <input name="text" type="text" required maxLength={2000} placeholder="Write a message…" autoComplete="off" />
            <button name="send" className="button">Send</button>
          </form>
        )}
      </div>
    </>
  );
}
