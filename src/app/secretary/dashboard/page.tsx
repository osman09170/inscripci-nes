import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from "@/lib/utils";

async function getTodayData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [openShift, todayRegistrations, activities] = await Promise.all([
    prisma.cashShift.findFirst({
      where: { userId, status: "OPEN" },
      include: { payments: true },
    }),
    prisma.registration.findMany({
      where: {
        createdById: userId,
        createdAt: { gte: today },
        status: "CONFIRMED",
      },
      include: {
        activity: { select: { title: true } },
        payments: { select: { method: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.activity.findMany({
      where: { isActive: true },
      select: { id: true, title: true, basePrice: true, date: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
  ]);

  return { openShift, todayRegistrations, activities };
}

const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-green-100 text-green-700",
  TRANSFER: "bg-blue-100 text-blue-700",
  CARD: "bg-purple-100 text-purple-700",
};

export default async function SecretaryDashboard() {
  const session = await getServerSession(authOptions);
  const { openShift, todayRegistrations, activities } = await getTodayData(
    session!.user.id
  );

  const totalCash = openShift?.payments
    .filter((p) => p.method === "CASH")
    .reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalTransfer = openShift?.payments
    .filter((p) => p.method === "TRANSFER")
    .reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalCard = openShift?.payments
    .filter((p) => p.method === "CARD")
    .reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalShift =
    openShift?.payments.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Bienvenida */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Hola, {session?.user.name}
          </h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link
          href="/secretary/register"
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Inscripción
        </Link>
      </div>

      {/* Resumen del turno */}
      {openShift && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 border-l-4 border-l-green-500">
            <p className="text-xs text-gray-500 mb-1">Total Turno</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalShift)}</p>
            <p className="text-xs text-gray-400 mt-1">{openShift.payments.length} cobros</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Efectivo</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(totalCash)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Transferencias</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totalTransfer)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Tarjeta</p>
            <p className="text-lg font-bold text-purple-700">{formatCurrency(totalCard)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inscripciones del día */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Inscripciones de Hoy</h3>
            <span className="text-xs text-gray-400">{todayRegistrations.length} registros</span>
          </div>
          {todayRegistrations.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <div className="text-3xl mb-2">📋</div>
              <p>Sin inscripciones hoy</p>
              <Link
                href="/secretary/register"
                className="inline-block mt-3 text-sm text-blue-700 hover:underline"
              >
                Registrar primera inscripción
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayRegistrations.map((reg: any) => (
                <div key={reg.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    {reg.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{reg.fullName}</p>
                    <p className="text-xs text-gray-400">{reg.activity.title}</p>
                  </div>
                  {reg.payment && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${METHOD_COLORS[reg.payment.method] ?? "bg-gray-100 text-gray-600"}`}>
                      {PAYMENT_METHOD_LABELS[reg.payment.method]}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(Number(reg.totalAmount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividades disponibles */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Actividades</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {activities.map((act) => (
              <div key={act.id} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-800 truncate">{act.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">
                    {new Date(act.date).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  </p>
                  <p className="text-xs font-semibold text-green-700">
                    {formatCurrency(Number(act.basePrice))}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">
                No hay actividades activas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}