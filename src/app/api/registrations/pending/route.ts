import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/registrations/pending — Cola de pendientes para secretaria
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const pending = await prisma.registration.findMany({
    where: { status: "PENDING" },
    include: {
      activity: {
        select: { title: true, basePrice: true, formConfig: true },
      },
    },
    orderBy: { createdAt: "asc" }, // Primero en llegar, primero en atender
  });

  // Parsear JSON de SQLite
  const result = pending.map((r) => ({
    ...r,
    lodging: r.lodging ? JSON.parse(r.lodging as string) : null,
    meals:   r.meals   ? JSON.parse(r.meals as string)   : null,
    activity: {
      ...r.activity,
      formConfig: r.activity.formConfig
        ? {
            fieldsConfig:  JSON.parse(r.activity.formConfig.fieldsConfig as string),
            pricingConfig: JSON.parse(r.activity.formConfig.pricingConfig as string),
          }
        : null,
    },
  }));

  return NextResponse.json(result);
}
