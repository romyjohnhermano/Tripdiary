"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getMe, requireMe, requireAdmin, loginStudent, logoutStudent, loginAdmin, logoutAdmin } from "@/lib/session";
import { saveImage, deleteImage } from "@/lib/upload";
import { notify, notifyFromAdmin } from "@/lib/notify";
import { isBlockedBetween } from "@/lib/queries";
import { str } from "@/lib/util";
import {
  APPEALABLE, COURSES, GENDERS, HIDE_AFTER_REPORTS, MAX_ADMIN_NOTE, MAX_APPEAL_LENGTH, MAX_COMMENT_LENGTH, MAX_MESSAGE_LENGTH,
  MAX_REPORT_DETAILS, NOTE, FEELINGS, REACTIONS, REPORT_REASONS, PHOTO_REASON, censor, findUnkind, fmt, needsSupport, preview,
} from "@/lib/moderation";

// Go to a page and show a message there (the Flash component reads ?msg=)
function go(path: string, msg?: string): never {
  const [p, hash] = path.split("#");
  const url = msg ? `${p}${p.includes("?") ? "&" : "?"}msg=${encodeURIComponent(msg)}` : p;
  redirect(hash ? `${url}#${hash}` : url);
}
// Only allow going back to a page on this site
function back(fd: FormData, fallback = "/feed"): string {
  const b = str(fd.get("back"));
  return b.startsWith("/") && !b.startsWith("//") ? b : fallback;
}
const refresh = () => revalidatePath("/", "layout");
const pw = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");
// Passwords hashed by PHP start with $2y$; bcryptjs reads $2a$ — same algorithm
const fixHash = (h: string) => h.replace(/^\$2y\$/, "$2a$");

/* ---------------- Accounts ---------------- */

export async function signup(fd: FormData) {
  const username = str(fd.get("username")), email = str(fd.get("email")).toLowerCase(), password = pw(fd.get("password"));
  const age = Number(fd.get("age")), gender = str(fd.get("gender")), birthdate = str(fd.get("birthdate"));
  const course = fd.getAll("course").map(String).filter((c) => COURSES.includes(c));

  let problem = "";
  if (!username || username.length > 50) problem = "Please enter a username (50 characters or less).";
  else if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 150) problem = "Please enter a valid email.";
  else if (!(age >= 10 && age <= 100)) problem = "Age must be between 10 and 100.";
  else if (!GENDERS.includes(gender)) problem = "Please choose a gender.";
  else if (!birthdate) problem = "Please enter your birth date.";
  else if (!course.length) problem = "Please choose at least one course.";
  else if (password.length < 4 || password.length > 200) problem = "Please choose a password of at least 4 characters.";
  if (problem) go("/signup", problem);

  let pic: string | null = null;
  try { pic = await saveImage(fd.get("profile_pic") as File | null, "profile", 3 * 1024 * 1024); }
  catch (e: any) { go("/signup", e.message); }

  const { error } = await db.from("student").insert({
    username, email, password: await bcrypt.hash(password, 10), age, gender, course: course.join(", "), birthdate, profile_pic: pic,
  });
  if (error) {
    await deleteImage(pic);
    go("/signup", error.code === "23505" ? "That email is already registered." : "Sign up failed. Please try again.");
  }
  go("/login", "Your Sign Up Was Successful!");
}

export async function login(fd: FormData) {
  const username = str(fd.get("username")), email = str(fd.get("email")).toLowerCase(), password = pw(fd.get("password"));
  const { data: u } = await db.from("student").select("student_id, username, password").eq("username", username).eq("email", email).maybeSingle();
  if (u && (await bcrypt.compare(password, fixHash(u.password)))) {
    await loginStudent(u.student_id, u.username);
    go("/feed", "Account accepted! Welcome!");
  }
  go("/login", "Email, username, or password is incorrect!");
}

export async function logout() { await logoutStudent(); go("/login"); }

export async function updateProfile(fd: FormData) {
  const me = await requireMe();
  const username = str(fd.get("username")), email = str(fd.get("email")).toLowerCase();
  const age = Number(fd.get("age")), password = pw(fd.get("password"));
  if (!username || !/^\S+@\S+\.\S+$/.test(email) || !(age >= 10 && age <= 100)) go(`/profile/${me.id}`, "Please check your details.");

  const update: Record<string, unknown> = { username, email, age };
  if (password) {
    if (password.length < 4) go(`/profile/${me.id}`, "Password must be at least 4 characters.");
    update.password = await bcrypt.hash(password, 10);
  }
  try {
    const pic = await saveImage(fd.get("profile_pic") as File | null, "profile", 3 * 1024 * 1024);
    if (pic) {
      const { data: old } = await db.from("student").select("profile_pic").eq("student_id", me.id).single();
      await deleteImage(old?.profile_pic);
      update.profile_pic = pic;
    }
  } catch (e: any) { go(`/profile/${me.id}`, e.message); }

  const { error } = await db.from("student").update(update).eq("student_id", me.id);
  if (error) go(`/profile/${me.id}`, error.code === "23505" ? "That email is already registered." : "Could not save changes.");
  await loginStudent(me.id, username);
  refresh();
  go(`/profile/${me.id}`, "Profile updated.");
}

/* ---------------- Posts ---------------- */

export async function createPost(fd: FormData) {
  const me = await requireMe();
  const desc = str(fd.get("desc")).slice(0, 5000);
  const feelingRaw = str(fd.get("feeling"));
  const feeling = feelingRaw in FEELINGS ? feelingRaw : null;
  let image: string | null = null;
  try { image = await saveImage(fd.get("post_image") as File | null, "posts", 5 * 1024 * 1024); }
  catch (e: any) { go("/create", e.message); }
  if (!desc && !image) go("/create", "Please write something or add a photo.");

  const { error } = await db.from("post").insert({
    description: desc, feeling, image, student_id: me.id, is_anonymous: fd.get("anonymous") === "on",
  });
  if (error) { await deleteImage(image); go("/create", "Error in Posting!"); }
  refresh();
  if (needsSupport(desc)) {
    go("/feed", "Your post was shared. Thank you for opening up — you are not alone.\n\nIf you are thinking about hurting yourself, please call the NCMH Crisis Hotline 1553 (free, 24/7) or talk to someone you trust right now.");
  }
  go("/feed", "Your post was successfully posted!");
}

async function livePost(postId: number) {
  const { data } = await db.from("post").select("post_id, student_id, is_anonymous").eq("post_id", postId).eq("removed", false).maybeSingle();
  return data;
}

export async function react(fd: FormData) {
  const me = await requireMe();
  const postId = Number(fd.get("postId")), type = str(fd.get("type")), to = back(fd);
  const post = await livePost(postId);
  if (!post || !(type in REACTIONS)) go(to, "That post is no longer available.");

  const { data: cur } = await db.from("reaction").select("type").eq("post_id", postId).eq("student_id", me.id).maybeSingle();
  if (cur) await db.from("notification").delete().eq("type", "reaction").eq("actor_id", me.id).eq("post_id", postId);
  if (cur?.type === type) {
    await db.from("reaction").delete().eq("post_id", postId).eq("student_id", me.id);
  } else {
    await db.from("reaction").upsert({ post_id: postId, student_id: me.id, type });
    await notify(post.student_id, me.id, "reaction", postId, null, type);
  }
  refresh();
  go(`${to}#post-${postId}`);
}

export async function toggleRepost(fd: FormData) {
  const me = await requireMe();
  const postId = Number(fd.get("postId")), to = back(fd);
  const post = await livePost(postId);
  if (!post) go(to, "That post is no longer available.");
  if (post.student_id === me.id) go(to, "You can't repost your own post.");
  if (post.is_anonymous) go(to, "You can't repost this post.");

  const { data: had } = await db.from("repost").select("post_id").eq("post_id", postId).eq("student_id", me.id).maybeSingle();
  if (had) {
    await db.from("repost").delete().eq("post_id", postId).eq("student_id", me.id);
    await db.from("notification").delete().eq("type", "repost").eq("actor_id", me.id).eq("post_id", postId);
  } else {
    await db.from("repost").insert({ post_id: postId, student_id: me.id });
    await notify(post.student_id, me.id, "repost", postId);
  }
  refresh();
  go(`${to}#post-${postId}`);
}

export async function addComment(fd: FormData) {
  const me = await requireMe();
  const postId = Number(fd.get("postId")), parentId = Number(fd.get("parentId")) || null, to = back(fd);
  const text = str(fd.get("text"));
  const post = await livePost(postId);
  if (!post) go(to, "That post is no longer available.");
  if (!text) go(`${to}#post-${postId}`, "Please write something.");
  if (text.length > MAX_COMMENT_LENGTH) go(`${to}#post-${postId}`, `Comments can be up to ${MAX_COMMENT_LENGTH} characters.`);
  const bad = findUnkind(text);
  if (bad) go(`${to}#post-${postId}`, "This place is for kindness, so judging or hurtful words can't be posted. Try saying it in a gentler way.");

  let parentOwner: number | null = null;
  if (parentId) {
    const { data: p } = await db.from("comment").select("student_id").eq("comment_id", parentId).eq("post_id", postId).eq("removed", false).maybeSingle();
    if (!p) go(to, "That comment is no longer available.");
    parentOwner = p.student_id;
  }
  const { data: c, error } = await db.from("comment").insert({ post_id: postId, parent_id: parentId, student_id: me.id, text: censor(text) }).select("comment_id").single();
  if (error || !c) go(to, "Could not post your comment.");

  const anonWriter = post.is_anonymous && post.student_id === me.id;
  if (parentOwner) await notify(parentOwner, me.id, "reply", postId, c.comment_id, null, anonWriter);
  if (post.student_id !== parentOwner) await notify(post.student_id, me.id, "comment", postId, c.comment_id, null, anonWriter);
  refresh();
  go(`${to}#post-${postId}`);
}

export async function deleteOwn(fd: FormData) {
  const me = await requireMe();
  const to = back(fd);
  const postId = Number(fd.get("postId")) || null, commentId = Number(fd.get("commentId")) || null;
  if (commentId) {
    await db.from("comment").delete().eq("comment_id", commentId).eq("student_id", me.id);
  } else if (postId) {
    const { data } = await db.from("post").select("image").eq("post_id", postId).eq("student_id", me.id).maybeSingle();
    if (data) { await db.from("post").delete().eq("post_id", postId); await deleteImage(data.image); }
  }
  refresh();
  go(to, commentId ? "Comment deleted." : "Post deleted.");
}

export async function reportContent(fd: FormData) {
  const me = await requireMe();
  const postId = Number(fd.get("postId")) || null, commentId = Number(fd.get("commentId")) || null, to = back(fd);
  const reason = str(fd.get("reason")), details = str(fd.get("details")).slice(0, MAX_REPORT_DETAILS);
  if (!REPORT_REASONS.includes(reason)) go(to, "Please choose a reason.");
  if (reason === "Other" && !details) go(to, "Please tell us a little about why.");

  let ownerId: number | null = null, title = "";
  if (commentId) {
    const { data } = await db.from("comment").select("student_id, text, post_id").eq("comment_id", commentId).eq("removed", false).maybeSingle();
    if (!data) go(to, "That comment is no longer available.");
    if (data.student_id === me.id) go(to, "You can't report your own comment.");
    ownerId = data.student_id; title = preview(data.text);
  } else if (postId) {
    const p = await db.from("post").select("student_id, description, image").eq("post_id", postId).eq("removed", false).maybeSingle();
    if (!p.data) go(to, "That post is no longer available.");
    if (p.data.student_id === me.id) go(to, "You can't report your own post.");
    ownerId = p.data.student_id; title = preview(p.data.description, p.data.image);
  } else go(to);

  const { error } = await db.from("report").insert({
    post_id: commentId ? null : postId, comment_id: commentId, student_id: me.id, reason, details: details || null,
  });
  if (error) go(to, error.code === "23505" ? "You already reported this." : "Could not send your report.");

  // Hit the limit exactly now? Hide it and tell the writer
  const q = db.from("report").select("report_id", { count: "exact", head: true }).neq("reason", PHOTO_REASON);
  const { count } = await (commentId ? q.eq("comment_id", commentId) : q.eq("post_id", postId!).is("comment_id", null));
  if (count === HIDE_AFTER_REPORTS) {
    await notifyFromAdmin(ownerId, fmt(commentId ? NOTE.comment_hidden : NOTE.post_hidden, title), postId, commentId, commentId ? "comment_hidden" : "post_hidden");
  }
  refresh();
  go(to, "Thank you for your report. An admin will check it within 5–10 hours.");
}

/* ---------------- Messages & safety ---------------- */

export async function sendMessage(fd: FormData) {
  const me = await requireMe();
  const to = Number(fd.get("to")), text = str(fd.get("text")).slice(0, MAX_MESSAGE_LENGTH);
  if (!text || !to || to === me.id) go(`/messages/${to}`);
  const b = await isBlockedBetween(me.id, to);
  if (b.iBlocked || b.blockedMe) go(`/messages/${to}`, "You can't message this person.");
  await db.from("message").insert({ sender_id: me.id, receiver_id: to, text });
  revalidatePath(`/messages/${to}`);
  go(`/messages/${to}`);
}

export async function blockUser(fd: FormData) {
  const me = await requireMe();
  const other = Number(fd.get("other")), to = back(fd, "/messages");
  if (other && other !== me.id) await db.from("block").upsert({ blocker_id: me.id, blocked_id: other });
  refresh();
  go(to, "Blocked. They can't message you anymore.");
}
export async function unblockUser(fd: FormData) {
  const me = await requireMe();
  await db.from("block").delete().eq("blocker_id", me.id).eq("blocked_id", Number(fd.get("other")));
  refresh();
  go(back(fd, "/messages"), "Unblocked.");
}
export async function reportConversation(fd: FormData) {
  const me = await requireMe();
  const other = Number(fd.get("other")), reason = str(fd.get("reason")), details = str(fd.get("details")).slice(0, MAX_REPORT_DETAILS);
  if (!REPORT_REASONS.includes(reason) || !other) go(back(fd, "/messages"), "Please choose a reason.");
  await db.from("message_report").insert({ reporter_id: me.id, reported_id: other, reason, details: details || null });
  go(back(fd, "/messages"), "Thank you. An admin will review this conversation.");
}

/* ---------------- Notifications & appeals ---------------- */

export async function markNotificationsRead() {
  const me = await requireMe();
  await db.from("notification").update({ is_read: true }).eq("student_id", me.id).eq("is_read", false);
  refresh();
}

export async function appeal(fd: FormData) {
  const me = await requireMe();
  const id = Number(fd.get("notificationId")), message = str(fd.get("message")).slice(0, MAX_APPEAL_LENGTH);
  const { data: n } = await db.from("notification").select("*").eq("notification_id", id).eq("student_id", me.id).maybeSingle();
  if (!n || !n.action || !(n.action in APPEALABLE)) go("/notifications", "That decision can't be appealed.");
  if (!message) go("/notifications", "Please tell the admin why it should come back.");
  const { error } = await db.from("appeal").insert({
    notification_id: id, student_id: me.id, post_id: n.post_id, comment_id: n.comment_id, action: n.action, message,
  });
  if (error) go("/notifications", "You already sent an appeal for this.");
  go("/notifications", "Your appeal was sent. An admin will review it within 5–10 hours, and you'll get the answer here.");
}

/* ---------------- Admin ---------------- */

export async function adminLogin(fd: FormData) {
  const email = str(fd.get("email")).toLowerCase(), password = pw(fd.get("password"));
  const { data } = await db.from("admin").select("email, password").eq("email", email).maybeSingle();
  if (data && (await bcrypt.compare(password, fixHash(data.password)))) { await loginAdmin(data.email); go("/admin"); }
  go("/admin/login", "Email or password is incorrect!");
}
export async function adminLogoutAction() { await logoutAdmin(); go("/admin/login"); }

const adminNote = (fd: FormData) => str(fd.get("note")).slice(0, MAX_ADMIN_NOTE) || null;

async function removePost(postId: number, note: string | null) {
  const { data: p } = await db.from("post").select("student_id, description, image").eq("post_id", postId).maybeSingle();
  if (!p) return;
  await db.from("post").update({ removed: true }).eq("post_id", postId);
  await notifyFromAdmin(p.student_id, fmt(NOTE.post_removed, preview(p.description, p.image)), postId, null, "post_removed", note);
}
async function removeComment(commentId: number, note: string | null) {
  const { data: c } = await db.from("comment").select("student_id, text, post_id").eq("comment_id", commentId).maybeSingle();
  if (!c) return;
  await db.from("comment").update({ removed: true }).eq("comment_id", commentId);
  await notifyFromAdmin(c.student_id, fmt(NOTE.comment_removed, preview(c.text)), c.post_id, commentId, "comment_removed", note);
}

export async function adminRemoveContent(fd: FormData) {
  await requireAdmin();
  const postId = Number(fd.get("postId")) || 0, commentId = Number(fd.get("commentId")) || 0;
  commentId ? await removeComment(commentId, adminNote(fd)) : await removePost(postId, adminNote(fd));
  refresh();
  go(back(fd, "/admin/reports"), "Removed, and the student was told.");
}

// Admin looked and the content is fine: clear reports so it shows again
export async function adminKeepContent(fd: FormData) {
  await requireAdmin();
  const postId = Number(fd.get("postId")) || 0, commentId = Number(fd.get("commentId")) || 0;
  if (commentId) {
    const { data: c } = await db.from("comment").select("student_id, text, post_id").eq("comment_id", commentId).maybeSingle();
    const { count } = await db.from("report").select("report_id", { count: "exact", head: true }).eq("comment_id", commentId);
    await db.from("report").delete().eq("comment_id", commentId);
    if (c && (count ?? 0) >= HIDE_AFTER_REPORTS) await notifyFromAdmin(c.student_id, fmt(NOTE.comment_kept, preview(c.text)), c.post_id, commentId, null, adminNote(fd));
  } else {
    const { data: p } = await db.from("post").select("student_id, description, image").eq("post_id", postId).maybeSingle();
    const { count } = await db.from("report").select("report_id", { count: "exact", head: true }).eq("post_id", postId).is("comment_id", null);
    await db.from("report").delete().eq("post_id", postId).is("comment_id", null);
    if (p && (count ?? 0) >= HIDE_AFTER_REPORTS) await notifyFromAdmin(p.student_id, fmt(NOTE.post_kept, preview(p.description, p.image)), postId, null, null, adminNote(fd));
  }
  refresh();
  go(back(fd, "/admin/reports"), "Reports dismissed.");
}

export async function adminDismissChatReport(fd: FormData) {
  await requireAdmin();
  await db.from("message_report").delete().eq("report_id", Number(fd.get("reportId")));
  go("/admin/reports", "Conversation report dismissed.");
}

export async function adminDeleteUser(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("studentId"));
  const { data: s } = await db.from("student").select("profile_pic").eq("student_id", id).maybeSingle();
  const { data: posts } = await db.from("post").select("image").eq("student_id", id);
  await db.from("student").delete().eq("student_id", id); // cascades to their posts, comments, messages...
  await deleteImage(s?.profile_pic);
  for (const p of posts || []) await deleteImage(p.image);
  refresh();
  go("/admin/users", "Student deleted.");
}

export async function adminDecideAppeal(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("appealId")), accept = fd.get("decision") === "accept", note = adminNote(fd);
  // Claim it first, so only one admin answers it
  const { data: ap } = await db.from("appeal").update({ decided_at: new Date().toISOString() })
    .eq("appeal_id", id).eq("status", "pending").is("decided_at", null).select("*").maybeSingle();
  if (!ap) go("/admin/appeals", "Someone already answered this appeal.");

  const commentId: number | null = ap.comment_id, postId: number | null = ap.post_id;
  if (accept) {
    if (ap.action === "post_removed") await db.from("post").update({ removed: false }).eq("post_id", postId!);
    if (ap.action === "comment_removed") await db.from("comment").update({ removed: false }).eq("comment_id", commentId!);
    if (ap.action === "post_hidden") await db.from("report").delete().eq("post_id", postId!).is("comment_id", null);
    if (ap.action === "comment_hidden") await db.from("report").delete().eq("comment_id", commentId!);
  }
  let title = "";
  if (commentId) title = preview((await db.from("comment").select("text").eq("comment_id", commentId).maybeSingle()).data?.text);
  else if (postId) { const p = (await db.from("post").select("description, image").eq("post_id", postId).maybeSingle()).data; title = preview(p?.description ?? "", p?.image); }
  const tpl = accept ? (NOTE as any)[`appeal_${ap.action}`] : NOTE.appeal_declined;
  await notifyFromAdmin(ap.student_id, fmt(tpl, title), postId, commentId, null, note);
  await db.from("appeal").update({ status: accept ? "accepted" : "declined", admin_note: note, decided_at: new Date().toISOString() }).eq("appeal_id", id);
  refresh();
  go("/admin/appeals", accept ? "Appeal accepted." : "Appeal declined.");
}
