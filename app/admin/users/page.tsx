import AdminShell from "@/components/AdminShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { adminDeleteUser } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  await requireAdmin();
  const { data } = await db.from("student").select("student_id, username, email, age, gender, course, profile_pic, created_at").order("student_id", { ascending: false });
  return (
    <AdminShell>
      <h1>Registered students</h1>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th></th><th>Username</th><th>Email</th><th>Age</th><th>Course</th><th></th></tr></thead>
          <tbody>
            {(data || []).map((s) => (
              <tr key={s.student_id}>
                <td><Avatar name={s.username} pic={s.profile_pic} size="sm" /></td><td>{s.username}</td><td>{s.email}</td><td>{s.age}</td><td>{s.course}</td>
                <td><form action={adminDeleteUser}><input type="hidden" name="studentId" value={s.student_id} /><button className="link">Delete</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
