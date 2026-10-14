import { prisma } from "@/lib/prisma";
import { formatDateTime, ROLE_LABELS } from "@/lib/utils";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { registrations: true, cashShifts: true } },
    },
    orderBy: { name: "asc" },
  });
}

export default async function UsersPage() {
  const users = await getUsers();
  const admins = users.filter((u) => u.role === "ADMIN");
  const secretaries = users.filter((u) => u.role === "SECRETARY");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios y Roles</h1>
          <p className="text-gray-500 mt-1">
            {admins.length} administrador(es) · {secretaries.length} secretaria(s)
          </p>
        </div>
        <CreateUserForm />
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inscripciones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turnos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        user.role === "ADMIN" ? "bg-[#1a0a2e]" : "bg-[#2d1054]"
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-[#1a0a2e]/10 text-[#1a0a2e]"
                        : "bg-[#2d1054]/10 text-[#2d1054]"
                    }`}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {user._count.registrations}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {user._count.cashShifts}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {user.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {formatDateTime(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}