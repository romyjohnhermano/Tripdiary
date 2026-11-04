import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { login } from "../actions";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" sub="A safe place to be heard.">
      <form action={login}>
        <label htmlFor="username">Username</label><input id="username" name="username" required autoComplete="username" />
        <label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" />
        <button className="button block">Log in</button>
      </form>
      <p className="small">New here? <Link href="/signup"><b>Create an account</b></Link></p>
    </AuthShell>
  );
}
