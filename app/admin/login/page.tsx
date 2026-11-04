import AuthShell from "@/components/AuthShell";
import { adminLogin } from "../../actions";

export default function AdminLoginPage() {
  return (
    <AuthShell title="Admin login" sub="For community admins only.">
      <form action={adminLogin}>
        <label>Email</label><input name="email" type="email" required />
        <label>Password</label><input name="password" type="password" required />
        <button className="button block">Log in</button>
      </form>
    </AuthShell>
  );
}
