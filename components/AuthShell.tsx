import Link from "next/link";
import { Suspense } from "react";
import Flash from "./Flash";

export default function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}><Flash /></Suspense>
      <div className="auth">
        <div className="brand" style={{ marginBottom: 16 }}>🏡 tripdiary</div>
        <div className="card">
          <h1>{title}</h1>
          <p className="muted">{sub}</p>
          {children}
          <p className="muted small" style={{ marginTop: 16 }}><Link href="/feed">View only</Link> — look around without an account.</p>
        </div>
      </div>
    </>
  );
}
