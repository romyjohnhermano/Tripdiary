import Link from "next/link";
import { Suspense } from "react";
import Flash from "./Flash";
import { adminLogoutAction } from "@/app/actions";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="nav admin-bar">
        <Link href="/admin" className="brand">🛡️ tripdiary admin</Link>
        <nav>
          <Link href="/admin">Dashboard</Link><Link href="/admin/users">Students</Link>
          <Link href="/admin/reports">Reports</Link><Link href="/admin/appeals">Appeals</Link>
          <form action={adminLogoutAction}><button className="link">Log out</button></form>
        </nav>
      </header>
      <Suspense fallback={null}><Flash /></Suspense>
      <main>{children}</main>
    </>
  );
}
