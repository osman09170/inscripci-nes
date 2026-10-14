import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const activitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
  dateEnd: z.string().nullable().optional(),
  location: z.string().optional(),
  basePrice: z.number().min(0),
  fieldsConfig: z.record(z.any()).optional(),
  pricingConfig: z.record(z.any()).optional(),
});

// GET /api/activities - Listar todas las actividades
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rawActivities = await prisma.activity.findMany({
    where: { isActive: true },
    include: {
      formConfig: true,
      _count: { select: { registrations: true } },
    },
    orderBy: { date: "asc" },
  });

  // Parsear JSON strings de SQLite
  const activities = rawActivities.map((a) => ({
    ...a,
    formConfig: a.formConfig
      ? {
          ...a.formConfig,
          fieldsConfig: JSON.parse(a.formConfig.fieldsConfig as string),
          pricingConfig: JSON.parse(a.formConfig.pricingConfig as string),
        }
      : null,
  }));

  return NextResponse.json(activities);
}

// POST /api/activities - Crear actividad (solo admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }

  const { fieldsConfig, pricingConfig, ...activityData } = parsed.data;

  try {
    const activity = await prisma.activity.create({
      data: {
        ...activityData,
        date: new Date(activityData.date),
        dateEnd: activityData.dateEnd ? new Date(activityData.dateEnd) : null,
        formConfig: {
          create: {
            fieldsConfig: JSON.stringify(fieldsConfig ?? {}),
            pricingConfig: JSON.stringify(pricingConfig ?? {}),
          },
        },
      },
      include: { formConfig: true },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (err: any) {
    console.error("Error creating activity:", err);
    return NextResponse.json({ error: err?.message ?? "Error interno al crear actividad" }, { status: 500 });
  }
}