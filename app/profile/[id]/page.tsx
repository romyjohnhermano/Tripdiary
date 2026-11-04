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
      <div className="page">
        <div className="profile-header">
          <Avatar name={s.username} pic={s.profile_pic} size="lg" />
          <h1>{s.username}</h1>
          {s.course && <p className="profile-course">{s.course}</p>}

          <div className="profile-stats">
            <div><strong>{posts.length}</strong>posts</div>
          </div>

          {me && !mine && (
            <div className="profile-actions">
              {!block?.blockedMe && !block?.iBlocked && <Link href={`/messages/${id}`}>✉️ Message</Link>}
              <form action={block?.iBlocked ? unblockUser : blockUser}>
                <input type="hidden" name="other" value={id} />
                <input type="hidden" name="back" value={back} />
                <button className="button ghost">{block?.iBlocked ? "Unblock" : "Block"}</button>
              </form>
            </div>
          )}
          {block?.iBlocked && <p className="blocked-note">You blocked this person.</p>}
        </div>

        {mine && (
          <details className="card-form" style={{ marginBottom: 20 }}>
            <summary>Edit my account</summary>
            <form action={updateProfile} className="auth-form">
              <div className="field"><label>Username</label><input name="username" type="text" defaultValue={s.username} required maxLength={50} /></div>
              <div className="field"><label>Email</label><input name="email" type="email" defaultValue={s.email} required /></div>
              <div className="field"><label>Age</label><input name="age" type="number" defaultValue={s.age ?? ""} min={10} max={100} required /></div>
              <div className="field">
                <label>New password <span className="optional">leave blank to keep</span></label>
                <input name="password" type="password" minLength={4} autoComplete="new-password" />
              </div>
              <div className="field"><label>Profile picture</label><input name="profile_pic" type="file" accept="image/jpeg,image/png,image/gif" /></div>
              <button className="button" style={{ marginTop: 12 }}>Save changes</button>
            </form>
          </details>
        )}

        <div className="profile-tabs">
          <a className="active" href={back}>Posts<span>{posts.length}</span></a>
        </div>

        {posts.length === 0 && <p className="page-note">No posts yet.</p>}
        {posts.map((p) => <PostCard key={p.post_id} post={p} meId={me?.id ?? null} back={back} />)}
      </div>
    </>
  );
}
