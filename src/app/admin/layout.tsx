import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/secretary/dashboard");

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen" style={{ background: "#f5f0ff" }}>
        {children}
      </main>
    </div>
  );
}