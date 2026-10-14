import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/cash-shifts - Obtener turno activo del usuario o todos (admin)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  if (session.user.role === "ADMIN") {
    // Admin puede ver todos los turnos
    const shifts = await prisma.cashShift.findMany({
      where: status ? { status: status as any } : {},
      include: {
        user: { select: { name: true, email: true } },
        payments: true,
      },
      orderBy: { openedAt: "desc" },
      take: 50,
    });
    return NextResponse.json(shifts);
  }

  // Secretaria solo ve su turno activo
  const shift = await prisma.cashShift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
    include: { payments: true },
  });

  return NextResponse.json(shift);
}

// POST /api/cash-shifts - Abrir caja
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verificar que no tenga una caja ya abierta
  const existingShift = await prisma.cashShift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });

  if (existingShift) {
    return NextResponse.json(
      { error: "Ya tienes una caja abierta", shift: existingShift },
      { status: 400 }
    );
  }

  const body = await req.json();
  const openingAmount = parseFloat(body.openingAmount ?? 0);

  const shift = await prisma.cashShift.create({
    data: {
      userId: session.user.id,
      openingAmount,
      status: "OPEN",
    },
  });

  return NextResponse.json(shift, { status: 201 });
}

// PATCH /api/cash-shifts - Cerrar caja (cuadre)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const closeSchema = z.object({
    shiftId: z.string(),
    closingCashAmount: z.number().min(0),
    closingTransferAmount: z.number().min(0),
    closingNotes: z.string().optional(),
  });

  const body = await req.json();
  const parsed = closeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }

  const { shiftId, closingCashAmount, closingTransferAmount, closingNotes } = parsed.data;

  // Calcular el monto esperado según los pagos registrados
  const shift = await prisma.cashShift.findUnique({
    where: { id: shiftId, userId: session.user.id, status: "OPEN" },
    include: { payments: true },
  });

  if (!shift) {
    return NextResponse.json({ error: "Turno no encontrado o ya cerrado" }, { status: 404 });
  }

  const expectedCash = shift.payments
    .filter((p) => p.method === "CASH")
    .reduce((sum, p) => sum + Number(p.amount), Number(shift.openingAmount));

  const expectedTransfer = shift.payments
    .filter((p) => p.method === "TRANSFER")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const expectedTotal = expectedCash + expectedTransfer;
  const physicalTotal = closingCashAmount + closingTransferAmount;
  const difference = physicalTotal - expectedTotal;

  const closed = await prisma.cashShift.update({
    where: { id: shiftId },
    data: {
      status: "CLOSED",
      closingCashAmount,
      closingTransferAmount,
      expectedAmount: expectedTotal,
      difference,
      closingNotes,
      closedAt: new Date(),
    },
    include: {
      user: { select: { name: true } },
      payments: true,
    },
  });

  return NextResponse.json(closed);
}