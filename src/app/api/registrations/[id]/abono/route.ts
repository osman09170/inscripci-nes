import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const abonoSchema = z.object({
  amount: z.number().min(0.01),
  method: z.enum(["CASH", "TRANSFER", "CARD"]),
  reference: z.string().optional(),
});

// POST /api/registrations/[id]/abono — Secretaria registra un pago/abono adicional
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const openShift = await prisma.cashShift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
  });
  if (!openShift) {
    return NextResponse.json(
      { error: "Debes tener una caja abierta para registrar pagos" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = abonoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { payments: true },
  });

  if (!registration) {
    return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
  }
  if (registration.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Inscripción no confirmada" }, { status: 400 });
  }
  if (registration.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Esta inscripción ya está pagada en su totalidad" }, { status: 400 });
  }

  const newTotalPaid = Number(registration.totalPaid) + parsed.data.amount;
  const isFullPayment = newTotalPaid >= Number(registration.totalAmount);

  const updated = await prisma.registration.update({
    where: { id },
    data: {
      totalPaid: newTotalPaid,
      paymentStatus: isFullPayment ? "PAID" : "PARTIAL",
      payments: {
        create: {
          amount: parsed.data.amount,
          method: parsed.data.method,
          reference: parsed.data.reference,
          isAbono: true,
          cashShiftId: openShift.id,
        },
      },
    },
    include: {
      activity: { select: { title: true } },
      payments: true,
    },
  });

  return NextResponse.json(updated);
}
