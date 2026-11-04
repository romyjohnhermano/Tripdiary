import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { getMe } from "@/lib/session";
import { logout } from "@/app/actions";
import Flash from "./Flash";
import ThemeMenu from "./ThemeMenu";
import NavLinks, { type NavItem } from "./NavLinks";
import { BellIcon, BrandLogo, ChatIcon, HomeIcon, LogoutIcon, LoginIcon, PlusIcon } from "./icons";

export default async function Nav() {
  const me = await getMe();
  let unread = 0, unreadMsgs = 0;
  if (me) {
    const [n, m] = await Promise.all([
      db.from("notification").select("notification_id", { count: "exact", head: true }).eq("student_id", me.id).eq("is_read", false),
      db.from("message").select("message_id", { count: "exact", head: true }).eq("receiver_id", me.id).eq("is_read", false),
    ]);
    unread = n.count ?? 0; unreadMsgs = m.count ?? 0;
  }

  const items: NavItem[] = me
    ? [
        { href: "/feed", label: "Community", icon: <HomeIcon /> },
        { href: "/create", label: "Create", icon: <PlusIcon /> },
        { href: "/messages", label: "Messages", icon: <ChatIcon />, badge: unreadMsgs },
        { href: "/notifications", label: "Notifications", icon: <BellIcon />, badge: unread },
      ]
    : [{ href: "/feed", label: "Community", icon: <HomeIcon /> }];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/feed" className="brand"><BrandLogo /><span>tripdiary</span></Link>
          <NavLinks items={items} />
          <div className="usermenu">
            {me ? (
              <>
                <Link href={`/profile/${me.id}`} className="userchip">
                  <span className="userchip-name">{me.username}</span>
                </Link>
                <ThemeMenu />
                <form action={logout}>
                  <button type="submit" className="icon-button" aria-label="Log out" title="Log out"><LogoutIcon /></button>
                </form>
              </>
            ) : (
              <>
                <ThemeMenu />
                <Link href="/login" className="icon-button" aria-label="Log in" title="Log in"><LoginIcon /></Link>
              </>
            )}
          </div>
        </div>
      </header>
      <Suspense fallback={null}><Flash /></Suspense>
    </>
  );
}
