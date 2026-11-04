"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-loads the conversation every few seconds so new messages appear
export default function ChatRefresh({ every = 4000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) router.refresh(); }, every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
