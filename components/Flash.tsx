"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// Shows the ?msg= notice at the top of the page, then hides it after a few seconds
export default function Flash() {
  const params = useSearchParams();
  const msg = params.get("msg");
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setOpen(true);
    if (!msg) return;
    const t = setTimeout(() => setOpen(false), Math.min(15000, 4000 + msg.length * 40));
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg || !open) return null;
  return (
    <div className="flash" role="status" onClick={() => setOpen(false)} title="Click to close">
      <span style={{ whiteSpace: "pre-line" }}>{msg}</span><span className="flash-close">×</span>
    </div>
  );
}
