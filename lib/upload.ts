import { randomBytes } from "crypto";
import { db } from "./db";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif" };

// Saves an uploaded image to Supabase Storage and returns its path (or null if no file).
// Throws an Error with a friendly message if the file is not OK.
export async function saveImage(file: File | null, folder: "profile" | "posts", maxBytes: number): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Please choose a JPG, PNG or GIF picture.");
  if (file.size > maxBytes) throw new Error(`That file is too big. Please choose one under ${Math.round(maxBytes / 1048576)} MB.`);
  const path = `${folder}/${randomBytes(16).toString("hex")}.${ext}`;
  const { error } = await db.storage.from("uploads").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new Error("Could not save the picture. Please try again.");
  return path;
}
export async function deleteImage(path: string | null | undefined) {
  if (path) await db.storage.from("uploads").remove([path]);
}
