"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; icon: ReactNode; badge?: number };

// Main menu. The current page gets the highlighted "active" pill.
export default function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="mainnav">
      {items.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : undefined}>
            {it.icon}
            {it.label}
            {!!it.badge && <b className="badge">{it.badge}</b>}
          </Link>
        );
      })}
    </nav>
  );
}
