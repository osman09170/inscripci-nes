import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

async function getSummary() {
  const [totalRevenue, totalRegistrations, activeActivities, openShifts] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.registration.count({ where: { status: "CONFIRMED" } }),
    prisma.activity.count({ where: { isActive: true } }),
    prisma.cashShift.count({ where: { status: "OPEN" } }),
  ]);
  return {
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    totalRegistrations,
    activeActivities,
    openShifts,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const summary = await getSummary();

  const cards = [
    {
      href: "/admin/activities",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: "Actividades",
      value: summary.activeActivities,
      unit: "activas",
      color: "from-[#1a0a2e] to-[#2d1054]",
      hover: "",
    },
    {
      href: "/admin/users",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Usuarios",
      value: 26,
      unit: "registrados",
      color: "from-[#2d1054] to-[#3d1f74]",
      hover: "",
    },
    {
      href: "/admin/reports",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "Reportes de Caja",
      value: formatCurrency(summary.totalRevenue),
      unit: "recaudado",
      color: "from-[#3d1f74] to-[#2d1054]",
      hover: "",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {session?.user.name}</h1>
        <p className="text-gray-500 mt-1">
          {summary.totalRegistrations} inscritos confirmados
          {summary.openShifts > 0 && ` · ${summary.openShifts} caja${summary.openShifts > 1 ? "s" : ""} abierta${summary.openShifts > 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-md transition hover:opacity-90`}
            style={{ border: "1px solid rgba(201,168,76,0.25)" }}
          >
            <div style={{ color: "#c9a84c" }}>{card.icon}</div>
            <div>
              <p className="text-3xl font-bold" style={{ color: "#c9a84c" }}>{card.value}</p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(201,168,76,0.6)" }}>{card.unit}</p>
            </div>
            <p className="font-semibold text-lg text-white">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
