import { Suspense } from "react";
import Link from "next/link";
import Flash from "./Flash";
import ThemeMenu from "./ThemeMenu";
import { BrandLogo, HeartIcon, PersonIcon, ShieldIcon } from "./icons";

// Split-screen layout used by Log in and Sign up (green hero on the left, form on the right)
export default function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <Suspense fallback={null}><Flash /></Suspense>
      <div className="auth">
        <aside className="auth-hero">
          <Link href="/feed" className="brand light"><BrandLogo /><span>tripdiary</span></Link>
          <div className="auth-hero-body">
            <h2>A safe place to share.</h2>
            <p>Share what you&apos;re going through and get support from fellow students — without judgment.</p>
            <ul className="auth-points">
              <li><ShieldIcon />Hurtful words are blocked and curse words are hidden</li>
              <li><PersonIcon />Post anonymously whenever you need to</li>
              <li><HeartIcon />Only kind reactions — hugs, support and strength</li>
            </ul>
          </div>
          <p className="auth-hero-foot">Need to talk to someone now? <strong>NCMH Crisis Hotline 1553</strong> · free, 24/7</p>
        </aside>
        <div className="auth-panel">
          <div className="auth-theme"><ThemeMenu /></div>
          <div className="auth-card">
            <h1>{title}</h1>
            <p className="auth-sub">{sub}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
