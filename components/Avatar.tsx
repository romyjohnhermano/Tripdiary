import { imgUrl } from "@/lib/util";

export default function Avatar({ name, pic, size = "md" }: { name: string | null; pic?: string | null; size?: "sm" | "md" | "lg" }) {
  if (name !== null && pic) return <img className={`avatar avatar-${size}`} src={imgUrl(pic)!} alt="" />;
  const letter = name === null ? "?" : name.slice(0, 1).toUpperCase();
  return <span className={`avatar avatar-${size}${name === null ? " avatar-anon" : ""}`}>{letter}</span>;
}
