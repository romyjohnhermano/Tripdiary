import AdminShell from "@/components/AdminShell";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const count = async (table: string, f?: (q: any) => any) => {
  const q = db.from(table).select("*", { count: "exact", head: true });
  return ((await (f ? f(q) : q)).count ?? 0) as number;
};

export default async function AdminHome() {
  await requireAdmin();
  const [students, posts, comments, reports, chatReports, appeals] = await Promise.all([
    count("student"), count("post", (q) => q.eq("removed", false)), count("comment", (q) => q.eq("removed", false)),
    count("report"), count("message_report"), count("appeal", (q) => q.eq("status", "pending")),
  ]);
  const stats: [string, number][] = [["Students", students], ["Posts", posts], ["Comments", comments], ["Reports", reports], ["Chat reports", chatReports], ["Pending appeals", appeals]];
  return (
    <AdminShell>
      <h1>Dashboard</h1>
      <div className="stats">{stats.map(([k, v]) => <div key={k} className="card stat"><b>{v}</b>{k}</div>)}</div>
    </AdminShell>
  );
}
