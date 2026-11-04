import Link from "next/link";
import Nav from "@/components/Nav";
import { requireMe } from "@/lib/session";
import { createPost } from "../actions";
import { FEELINGS } from "@/lib/moderation";

// Emoji shown on each feeling choice (the PHP site used face images)
const FACE: Record<string, string> = {
  sad: "😢", anxious: "😰", stressed: "😫", lonely: "🥺", tired: "😴", overwhelmed: "😵",
  frustrated: "😤", heartbroken: "💔", confused: "😕", okay: "🙂", calm: "😌",
  hopeful: "🌱", grateful: "🙏", happy: "😀", proud: "🥹",
};

export default async function CreatePage() {
  await requireMe();
  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-head">
          <div><h1>Share something</h1><p>Say what&apos;s on your mind. This community listens without judging.</p></div>
        </div>
        <div className="card-form">
          <form action={createPost}>
            <div className="field">
              <label htmlFor="desc">What&apos;s on your mind?</label>
              <textarea id="desc" name="desc" maxLength={5000} placeholder="Share what's on your mind (optional if you add a photo)" />
            </div>

            <div className="field">
              <span className="label">How are you feeling right now? <span className="optional">optional</span></span>
              <div className="choices feelings">
                <label className="choice"><input type="radio" name="feeling" value="" defaultChecked /><span>Skip</span></label>
                {Object.keys(FEELINGS).map((f) => (
                  <label key={f} className="choice">
                    <input type="radio" name="feeling" value={f} />
                    <span>{FACE[f] ?? ""} {f}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="label">Photo <span className="optional">optional · JPG, PNG or GIF · max 5 MB</span></span>
              <label className="file-drop">
                <span className="file-drop-text">📷 Choose a photo</span>
                <input type="file" name="post_image" accept="image/jpeg,image/png,image/gif" />
              </label>
            </div>

            <label className="toggle">
              <input type="checkbox" name="anonymous" />
              <span>
                <strong>Post anonymously</strong>
                No one sees your name or picture, not even admins. Admins only find out who wrote it if the post is reported.
              </span>
            </label>

            <div className="form-actions">
              <Link href="/feed" className="button ghost">Cancel</Link>
              <button className="button">Post</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
