import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { login } from "../actions";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" sub="Log in to see what your community is sharing.">
      <form action={login} className="auth-form">
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" required autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <button className="button block">Log in</button>
      </form>
      <p className="auth-switch">Or <Link href="/feed"><b>view only</b></Link> — look around the community without an account.</p>
      <p className="auth-switch">New here? <Link href="/signup"><b>Create an account</b></Link></p>
    </AuthShell>
  );
}
