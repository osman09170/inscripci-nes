import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/registrations/confirmed — Lista de inscritos confirmados para secretaria
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const activityId = searchParams.get("activityId") ?? undefined;
  const paymentStatus = searchParams.get("paymentStatus") ?? undefined;

  const registrations = await prisma.registration.findMany({
    where: {
      status: "CONFIRMED",
      ...(activityId ? { activityId } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    },
    include: {
      activity: { select: { id: true, title: true } },
      payments: { orderBy: { confirmedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = registrations.map((r) => ({
    ...r,
    lodging: r.lodging ? JSON.parse(r.lodging as string) : null,
    meals: r.meals ? JSON.parse(r.meals as string) : null,
  }));

  return NextResponse.json(result);
}
