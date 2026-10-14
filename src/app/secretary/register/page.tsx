import { prisma } from "@/lib/prisma";
import { RegistrationForm } from "@/components/secretary/RegistrationForm";

async function getActivities() {
  return prisma.activity.findMany({
    where: { isActive: true },
    include: { formConfig: true },
    orderBy: { date: "asc" },
  });
}

export default async function RegisterPage() {
  const activities = await getActivities();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Inscripción</h1>
        <p className="text-gray-500 mt-1">Registra a un asistente en una actividad</p>
      </div>

      <RegistrationForm activities={activities as any} />
    </div>
  );
}