import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/db";
import { requireMe } from "@/lib/session";
import { timeAgo } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const me = await requireMe();
  const { data: msgs } = await db.from("message").select("*").or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
    .order("message_id", { ascending: false }).limit(300);

  const convos = new Map<number, { last: any; unread: number }>();
  for (const m of msgs || []) {
    const other = m.sender_id === me.id ? m.receiver_id : m.sender_id;
    const c = convos.get(other) ?? { last: m, unread: 0 };
    if (m.receiver_id === me.id && !m.is_read) c.unread++;
    convos.set(other, c);
  }
  const ids = [...convos.keys()];
  const { data: people } = ids.length
    ? await db.from("student").select("student_id, username, profile_pic").in("student_id", ids) : { data: [] as any[] };
  const { data: others } = await db.from("student").select("student_id, username, profile_pic").neq("student_id", me.id).order("username").limit(60);

  return (
    <>
      <Nav />
      <main>
        <h1>Messages</h1>
        <div className="card">
          {convos.size === 0 && <p className="muted">No conversations yet. Pick someone below to say hi.</p>}
          {[...convos.entries()].map(([id, c]) => {
            const p = people?.find((x) => x.student_id === id);
            if (!p) return null;
            return (
              <Link key={id} href={`/messages/${id}`} className={`list-row${c.unread ? " unread" : ""}`}>
                <Avatar name={p.username} pic={p.profile_pic} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {p.username} {c.unread > 0 && <b className="badge">{c.unread}</b>}
                  <div className="muted small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.last.sender_id === me.id ? "You: " : ""}{c.last.text}
                  </div>
                </div>
                <span className="muted small">{timeAgo(c.last.created_at)}</span>
              </Link>
            );
          })}
        </div>
        <h2>Start a conversation</h2>
        <div className="card">
          {(others || []).map((p) => (
            <Link key={p.student_id} href={`/messages/${p.student_id}`} className="list-row"><Avatar name={p.username} pic={p.profile_pic} size="sm" /> {p.username}</Link>
          ))}
        </div>
      </main>
    </>
  );
}
