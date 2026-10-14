import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard - Métricas globales (solo admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [
    totalRevenueResult,
    totalRegistrations,
    activeActivities,
    openShifts,
    revenueByActivity,
    revenueBySecretary,
    recentRegistrations,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.registration.count({ where: { status: "CONFIRMED" } }),
    prisma.activity.count({ where: { isActive: true } }),
    prisma.cashShift.count({ where: { status: "OPEN" } }),

    // Ingresos y conteo por actividad
    prisma.activity.findMany({
      select: {
        title: true,
        registrations: {
          where: { status: "CONFIRMED" },
          select: { totalAmount: true },
        },
      },
    }),

    // Ingresos por secretaria
    prisma.user.findMany({
      where: { role: "SECRETARY" },
      select: {
        name: true,
        cashShifts: {
          select: {
            payments: { select: { amount: true } },
          },
        },
      },
    }),

    // Últimas inscripciones
    prisma.registration.findMany({
      where: { status: "CONFIRMED" },
      include: {
        activity: { select: { title: true } },
        payments: { select: { method: true, amount: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Formatear ingresos por actividad
  const revenueByActivityFormatted = revenueByActivity.map((a) => ({
    name: a.title,
    total: a.registrations.reduce((sum, r) => sum + Number(r.totalAmount), 0),
    count: a.registrations.length,
  }));

  // Formatear ingresos por secretaria
  const revenueBySecretaryFormatted = revenueBySecretary.map((u) => ({
    name: u.name,
    total: u.cashShifts.reduce(
      (sum, shift) =>
        sum + shift.payments.reduce((s, p) => s + Number(p.amount), 0),
      0
    ),
  }));

  return NextResponse.json({
    totalRevenue: Number(totalRevenueResult._sum.amount ?? 0),
    totalRegistrations,
    activeActivities,
    openShifts,
    revenueByActivity: revenueByActivityFormatted,
    revenueBySecretary: revenueBySecretaryFormatted,
    recentRegistrations,
  });
}