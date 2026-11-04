import Link from "next/link";
import Nav from "@/components/Nav";
import PostCard from "@/components/PostCard";
import { getMe } from "@/lib/session";
import { loadPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const me = await getMe();
  const posts = await loadPosts(me?.id ?? null);
  return (
    <>
      <Nav />
      <div className="page">
        <div className="page-head">
          <div><h1>Community</h1><p className="muted">A safe place to share. Be kind — everyone here is going through something.</p></div>
          <Link href={me ? "/create" : "/login"} className="button">＋ Share something</Link>
        </div>
        {posts.length === 0 && <p className="muted">No posts yet. <Link href="/create">Be the first to share.</Link></p>}
        {posts.map((p) => <PostCard key={p.post_id} post={p} meId={me?.id ?? null} back="/feed" />)}
      </div>
    </>
  );
}
