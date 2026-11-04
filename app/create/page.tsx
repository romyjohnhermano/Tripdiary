import Nav from "@/components/Nav";
import { requireMe } from "@/lib/session";
import { createPost } from "../actions";
import { FEELINGS } from "@/lib/moderation";

export default async function CreatePage() {
  await requireMe();
  return (
    <>
      <Nav />
      <main>
        <h1>Share something</h1>
        <p className="muted">Write what&apos;s on your mind. You can post anonymously.</p>
        <form action={createPost} className="card">
          <label htmlFor="desc">What&apos;s on your mind?</label>
          <textarea id="desc" name="desc" maxLength={5000} />
          <label htmlFor="feeling">How are you feeling? <span className="muted small">optional</span></label>
          <select id="feeling" name="feeling" defaultValue="">
            <option value="">—</option>
            {Object.keys(FEELINGS).map((f) => <option key={f}>{f}</option>)}
          </select>
          <label htmlFor="img">Photo <span className="muted small">optional · max 5 MB</span></label>
          <input id="img" name="post_image" type="file" accept="image/jpeg,image/png,image/gif" />
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 400 }}>
            <input type="checkbox" name="anonymous" style={{ width: "auto" }} /> Post anonymously
          </label>
          <button className="button" style={{ marginTop: 14 }}>Post</button>
        </form>
      </main>
    </>
  );
}
