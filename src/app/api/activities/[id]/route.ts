import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const editSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
  dateEnd: z.string().nullable().optional(),
  location: z.string().optional(),
  basePrice: z.number().min(0),
  fieldsConfig: z.record(z.any()).optional(),
  pricingConfig: z.record(z.any()).optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

// PATCH — actualizar isActive (cerrar/reactivar)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const { isActive } = await req.json();
  const activity = await prisma.activity.update({
    where: { id },
    data: { isActive: Boolean(isActive) },
  });
  return NextResponse.json(activity);
}

// PUT — editar actividad completa
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = editSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors.map(e => e.message).join(", ") },
      { status: 400 }
    );
  }

  const { fieldsConfig, pricingConfig, ...activityData } = parsed.data;

  const activity = await prisma.activity.update({
    where: { id },
    data: {
      ...activityData,
      date: new Date(activityData.date),
      dateEnd: activityData.dateEnd ? new Date(activityData.dateEnd) : null,
      formConfig: {
        upsert: {
          create: {
            fieldsConfig: JSON.stringify(fieldsConfig ?? {}),
            pricingConfig: JSON.stringify(pricingConfig ?? {}),
          },
          update: {
            fieldsConfig: JSON.stringify(fieldsConfig ?? {}),
            pricingConfig: JSON.stringify(pricingConfig ?? {}),
          },
        },
      },
    },
    include: { formConfig: true },
  });

  return NextResponse.json(activity);
}

// DELETE — eliminar actividad completa
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  // Eliminar en cascada manualmente (SQLite no siempre tiene FK cascade)
  const registrations = await prisma.registration.findMany({
    where: { activityId: id },
    select: { id: true },
  });
  const regIds = registrations.map(r => r.id);

  await prisma.payment.deleteMany({ where: { registrationId: { in: regIds } } });
  await prisma.registration.deleteMany({ where: { activityId: id } });
  await prisma.formConfig.deleteMany({ where: { activityId: id } });
  await prisma.activity.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
