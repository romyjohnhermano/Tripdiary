export function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units: [string, number][] = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, n] of units) if (s >= n) { const k = Math.floor(s / n); return `${k} ${u}${k > 1 ? "s" : ""} ago`; }
  return "just now";
}
export const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

// Public URL of a file in the "uploads" bucket
export function imgUrl(path: string | null | undefined): string | null {
  return path ? `${process.env.SUPABASE_URL}/storage/v1/object/public/uploads/${path}` : null;
}
