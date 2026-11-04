import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-change-me-please-32chars");
const STUDENT = "td_student";
const ADMIN = "td_admin";

async function sign(payload: Record<string, unknown>) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("14d").sign(secret());
}
async function read(name: string): Promise<Record<string, any> | null> {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload as Record<string, any>; } catch { return null; }
}
const opts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 14 };

export type Me = { id: number; username: string };

export async function loginStudent(id: number, username: string) {
  (await cookies()).set(STUDENT, await sign({ id, username }), opts);
}
export async function logoutStudent() { (await cookies()).delete(STUDENT); }

// Returns the logged-in student, or null for guests. Also ends "ghost" logins
// (an admin deleted the account while it was still logged in).
export async function getMe(): Promise<Me | null> {
  const s = await read(STUDENT);
  if (!s?.id) return null;
  const { data } = await db.from("student").select("student_id, username").eq("student_id", s.id).maybeSingle();
  if (!data) return null;
  return { id: data.student_id, username: data.username };
}
export async function requireMe(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/login");
  return me;
}

export async function loginAdmin(email: string) { (await cookies()).set(ADMIN, await sign({ email }), opts); }
export async function logoutAdmin() { (await cookies()).delete(ADMIN); }
export async function requireAdmin(): Promise<string> {
  const s = await read(ADMIN);
  if (!s?.email) redirect("/admin/login");
  const { data } = await db.from("admin").select("email").eq("email", s.email).maybeSingle();
  if (!data) redirect("/admin/login");
  return s.email as string;
}
