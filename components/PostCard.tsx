import Link from "next/link";
import Avatar from "./Avatar";
import ReportForm from "./ReportForm";
import { addComment, deleteOwn, react, toggleRepost } from "@/app/actions";
import { CRISIS_HOTLINES, FEELINGS, REACTIONS, censor, needsSupport } from "@/lib/moderation";
import { imgUrl, timeAgo } from "@/lib/util";
import type { CommentT, PostT } from "@/lib/queries";

function CommentForm({ postId, parentId, back }: { postId: number; parentId?: number; back: string }) {
  return (
    <form action={addComment} className="comment-form">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input type="hidden" name="back" value={back} />
      <input name="text" required maxLength={1000} placeholder={parentId ? "Write a reply…" : "Write something kind…"} />
      <button className="button small">{parentId ? "Reply" : "Comment"}</button>
    </form>
  );
}

function Comment({ c, post, meId, back, reply = false }: { c: CommentT; post: PostT; meId: number | null; back: string; reply?: boolean }) {
  // The writer of an anonymous post stays anonymous when they comment on it
  const anon = post.is_anonymous && c.student_id === post.student_id;
  const mine = meId === c.student_id;
  return (
    <div className={`comment${reply ? " reply" : ""}`}>
      <Avatar name={anon ? null : c.username} pic={anon ? null : c.profile_pic} size="sm" />
      <div className="comment-body">
        <div className="comment-head">
          {anon ? <b>Anonymous</b> : <Link href={`/profile/${c.student_id}`}><b>{c.username}</b></Link>}
          <span className="muted small">{timeAgo(c.created_at)}</span>
        </div>
        {c.hidden && <p className="notice small">Hidden after several reports. Only you can see this until an admin decides.</p>}
        <p>{c.text}</p>
        {meId && (
          <div className="actions small">
            {mine ? (
              <form action={deleteOwn}><input type="hidden" name="commentId" value={c.comment_id} /><input type="hidden" name="back" value={back} /><button className="link">Delete</button></form>
            ) : (
              <ReportForm postId={post.post_id} commentId={c.comment_id} back={back} done={c.reported_by_me} />
            )}
            {!reply && <details><summary>Reply</summary><CommentForm postId={post.post_id} parentId={c.comment_id} back={back} /></details>}
          </div>
        )}
        {c.replies.map((r) => <Comment key={r.comment_id} c={r} post={post} meId={meId} back={back} reply />)}
      </div>
    </div>
  );
}

export default function PostCard({ post, meId, back }: { post: PostT; meId: number | null; back: string }) {
  const mine = meId !== null && meId === post.student_id;
  const anon = post.is_anonymous;
  const name = anon || !post.username ? null : post.username;
  const here = `${back}#post-${post.post_id}`;
  return (
    <article className="card" id={`post-${post.post_id}`}>
      <div className="post-head">
        <Avatar name={name} pic={post.profile_pic} />
        <div>
          {name && post.student_id ? <Link href={`/profile/${post.student_id}`}><b>{name}</b></Link> : <b>Anonymous</b>}
          {anon && mine && <span className="muted small"> (only you know this is you)</span>}
          <div className="muted small">{timeAgo(post.created_at)}</div>
        </div>
        {post.feeling && post.feeling in FEELINGS && (
          <span className="feeling" style={{ background: FEELINGS[post.feeling] }}>feeling {post.feeling}</span>
        )}
      </div>

      {post.hidden && <p className="notice small">Hidden after several reports. Only you can see this until an admin decides.</p>}
      {post.description && <p className="post-text">{censor(post.description)}</p>}
      {post.image && <img className="post-img" src={imgUrl(post.image)!} alt="" />}

      {needsSupport(post.description) && (
        <div className="hotline">
          <b>You are not alone.</b> If you are thinking about hurting yourself, please reach out:
          <ul>{Object.entries(CRISIS_HOTLINES).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
        </div>
      )}

      <div className="actions">
        {Object.entries(REACTIONS).map(([type, r]) => (
          <form action={react} key={type}>
            <input type="hidden" name="postId" value={post.post_id} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="back" value={back} />
            <button className={`pill${post.mine === type ? " on" : ""}`} disabled={!meId} title={meId ? r.label : "Log in to react"}>
              {r.emoji} {r.label} {post.reactions[type] > 0 && <b>{post.reactions[type]}</b>}
            </button>
          </form>
        ))}
        {!anon && !mine && (
          <form action={toggleRepost}>
            <input type="hidden" name="postId" value={post.post_id} />
            <input type="hidden" name="back" value={back} />
            <button className={`pill${post.reposted_by_me ? " on" : ""}`} disabled={!meId}>🔁 Repost {post.repost_count > 0 && <b>{post.repost_count}</b>}</button>
          </form>
        )}
        {meId && (mine ? (
          <form action={deleteOwn}><input type="hidden" name="postId" value={post.post_id} /><input type="hidden" name="back" value={back} /><button className="link">Delete</button></form>
        ) : <ReportForm postId={post.post_id} back={here} done={post.reported_by_me} />)}
      </div>

      <div className="comments">
        {post.comments.map((c) => <Comment key={c.comment_id} c={c} post={post} meId={meId} back={here} />)}
        {meId ? <CommentForm postId={post.post_id} back={here} /> : <p className="muted small"><Link href="/login">Log in</Link> to comment.</p>}
      </div>
    </article>
  );
}
