// Small inline icons (stroke style) used by the nav and auth pages.
const base = { className: "icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const HomeIcon = () => <svg {...base}><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>;
export const PlusIcon = () => <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
export const ChatIcon = () => <svg {...base}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>;
export const BellIcon = () => <svg {...base}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
export const LogoutIcon = () => <svg {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>;
export const LoginIcon = () => <svg {...base}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></svg>;
export const ThemeIcon = () => <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" /></svg>;
export const ShieldIcon = () => <svg {...base}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
export const PersonIcon = () => <svg {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const HeartIcon = () => <svg {...base}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" /></svg>;

// Logo mark: a green rounded square with a white house shape (the PHP site's logo)
export function BrandLogo() {
  return (
    <svg className="brand-logo" viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="10" fill="var(--primary)" />
      <path d="M9 17 17 10l8 7v7h-5v-4h-6v4H9z" fill="#fff" />
    </svg>
  );
}
