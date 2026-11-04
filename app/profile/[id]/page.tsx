import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import PostCard from "@/components/PostCard";
import { db } from "@/lib/db";
import { getMe } from "@/lib/session";
import { isBlockedBetween, loadPosts } from "@/lib/queries";
import { blockUser, unblockUser, updateProfile } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!id) notFound();
  const me = await getMe();
  const { data: s } = await db.from("student").select("student_id, username, email, age, course, profile_pic, created_at").eq("student_id", id).maybeSingle();
  if (!s) notFound();
  const mine = me?.id === id;
  // Anonymous posts never show on a profile
  const posts = (await loadPosts(me?.id ?? null, { studentId: id })).filter((p) => !p.is_anonymous);
  const block = me && !mine ? await isBlockedBetween(me.id, id) : null;
  const back = `/profile/${id}`;

  return (
    <>
      <Nav />
      <main>
        <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar name={s.username} pic={s.profile_pic} size="lg" />
          <div style={{ flex: 1 }}>
            <h1>{s.username}</h1>
            <p className="muted">{s.course}</p>
          </div>
          {me && !mine && (
            <div className="actions">
              {!block?.blockedMe && !block?.iBlocked && <Link href={`/messages/${id}`} className="button">Message</Link>}
              <form action={block?.iBlocked ? unblockUser : blockUser}>
                <input type="hidden" name="other" value={id} /><input type="hidden" name="back" value={back} />
                <button className="button ghost">{block?.iBlocked ? "Unblock" : "Block"}</button>
              </form>
            </div>
          )}
        </div>

        {mine && (
          <details className="card">
            <summary>Edit my account</summary>
            <form action={updateProfile}>
              <label>Username</label><input name="username" defaultValue={s.username} required maxLength={50} />
              <label>Email</label><input name="email" type="email" defaultValue={s.email} required />
              <label>Age</label><input name="age" type="number" defaultValue={s.age ?? ""} min={10} max={100} required />
              <label>New password <span className="muted small">leave blank to keep</span></label><input name="password" type="password" minLength={4} autoComplete="new-password" />
              <label>Profile picture</label><input name="profile_pic" type="file" accept="image/jpeg,image/png,image/gif" />
              <button className="button" style={{ marginTop: 12 }}>Save changes</button>
            </form>
          </details>
        )}

        <h2>Posts</h2>
        {posts.length === 0 && <p className="muted">No posts yet.</p>}
        {posts.map((p) => <PostCard key={p.post_id} post={p} meId={me?.id ?? null} back={back} />)}
      </main>
    </>
  );
}
