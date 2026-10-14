import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const confirmSchema = z.object({
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD"]),
  paymentReference: z.string().optional(),
  totalAmount: z.number().min(0),
  amountPaid: z.number().min(0), // monto que paga ahora (puede ser abono)
});

// PATCH /api/registrations/[id]/confirm — Secretaria confirma y cobra (pago total o abono)
export async function PATCH(
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
      { error: "Debes tener una caja abierta para confirmar pagos" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }

  const registration = await prisma.registration.findUnique({ where: { id } });

  if (!registration) {
    return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
  }
  if (registration.status !== "PENDING") {
    return NextResponse.json({ error: "Esta inscripción ya fue procesada" }, { status: 400 });
  }

  const { totalAmount, amountPaid, paymentMethod, paymentReference } = parsed.data;
  const isFullPayment = amountPaid >= totalAmount;
  const newTotalPaid = amountPaid;
  const newPaymentStatus = isFullPayment ? "PAID" : "PARTIAL";

  const updated = await prisma.registration.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      totalAmount,
      totalPaid: newTotalPaid,
      paymentStatus: newPaymentStatus,
      payments: {
        create: {
          amount: amountPaid,
          method: paymentMethod,
          reference: paymentReference,
          isAbono: !isFullPayment,
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
