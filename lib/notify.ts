import { db } from "./db";

// Tell a student something happened. Skips self-notifications.
// anonymousActor: the actor is the writer of an anonymous post, so their name must never show.
export async function notify(studentId: number | null, actorId: number | null, type: string,
  postId: number | null, commentId: number | null = null, reaction: string | null = null, anonymousActor = false) {
  if (!studentId || studentId === actorId) return;
  await db.from("notification").insert({
    student_id: studentId, actor_id: anonymousActor ? null : actorId, type,
    post_id: postId, comment_id: commentId, reaction_type: reaction,
  });
}

export async function notifyFromAdmin(studentId: number | null, message: string, postId: number | null,
  commentId: number | null = null, action: string | null = null, adminNote: string | null = null) {
  if (!studentId) return;
  await db.from("notification").insert({
    student_id: studentId, type: "admin", message, post_id: postId, comment_id: commentId, action, admin_note: adminNote,
  });
}
