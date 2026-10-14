import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateTicket } from "@/lib/utils";

const registrationSchema = z.object({
  activityId: z.string(),
  fullName: z.string().min(1),
  age: z.number().int().min(1).max(120),
  shirtSize: z.string().optional(),
  area: z.string().optional(),
  wantsTransport: z.boolean().default(false),
  transportRoute: z.string().optional(),
  lodging: z.object({ needed: z.boolean() }).optional(),
  meals: z.object({ needed: z.boolean() }).optional(),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD"]),
  paymentReference: z.string().optional(),
});

// POST /api/registrations - Crear inscripción con pago
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verificar que la secretaria tiene caja abierta
  if (session.user.role === "SECRETARY") {
    const openShift = await prisma.cashShift.findFirst({
      where: { userId: session.user.id, status: "OPEN" },
    });
    if (!openShift) {
      return NextResponse.json(
        { error: "Debes abrir tu caja antes de registrar inscripciones" },
        { status: 400 }
      );
    }
  }

  const body = await req.json();
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }

  const { paymentMethod, paymentReference, totalAmount, lodging, meals, ...regData } = parsed.data;

  // Obtener caja activa de la secretaria
  const openShift = await prisma.cashShift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });

  const activity = await prisma.activity.findUnique({
    where: { id: regData.activityId },
    select: { title: true },
  });

  const ticket = generateTicket(activity?.title ?? "EVT");

  const registration = await prisma.registration.create({
    data: {
      ...regData,
      ticket,
      totalAmount,
      createdById: session.user.id,
      status: "CONFIRMED",
      totalPaid: totalAmount,
      paymentStatus: "PAID",
      // SQLite guarda JSON como String
      lodging: lodging ? JSON.stringify(lodging) : undefined,
      meals: meals ? JSON.stringify(meals) : undefined,
      payments: {
        create: {
          amount: totalAmount,
          method: paymentMethod,
          reference: paymentReference,
          cashShiftId: openShift?.id,
        },
      },
    },
    include: {
      activity: true,
      payments: true,
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(registration, { status: 201 });
}

// GET /api/registrations - Listar inscripciones
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const activityId = searchParams.get("activityId");
  const search = searchParams.get("search");

  const where: any = {};
  if (activityId) where.activityId = activityId;
  if (search) where.fullName = { contains: search }; // SQLite no soporta mode: insensitive

  // Secretarias solo ven las de su turno activo o del día
  if (session.user.role === "SECRETARY") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.createdById = session.user.id;
    where.createdAt = { gte: today };
  }

  const registrations = await prisma.registration.findMany({
    where,
    include: {
      activity: { select: { title: true } },
      payments: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(registrations);
}