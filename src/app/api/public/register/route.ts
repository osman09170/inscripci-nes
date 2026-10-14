import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateTicket } from "@/lib/utils";

const schema = z.object({
  activityId: z.string(),
  fullName: z.string().min(1),
  age: z.number().int().min(1).max(120),
  shirtSize: z.string().optional(),
  area: z.string().optional(),
  wantsTransport: z.boolean().default(false),
  transportRoute: z.string().optional(),
  lodging: z.object({ needed: z.boolean() }).optional(),
  meals: z.object({ needed: z.boolean() }).optional(),
  notes: z.string().optional(),
});

// POST /api/public/register — Sin auth, crea inscripción PENDIENTE desde el tablet
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }

  const { lodging, meals, ...data } = parsed.data;

  const activity = await prisma.activity.findUnique({
    where: { id: data.activityId, isActive: true },
    include: { formConfig: true },
  });

  if (!activity) {
    return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });
  }

  const ticket = generateTicket(activity.title);

  const registration = await prisma.registration.create({
    data: {
      ...data,
      ticket,
      totalAmount: Number(activity.basePrice),
      status: "PENDING",
      createdById: "public-tablet",
      lodging: lodging ? JSON.stringify(lodging) : undefined,
      meals: meals ? JSON.stringify(meals) : undefined,
    },
    include: {
      activity: { select: { title: true, date: true } },
    },
  });

  return NextResponse.json(
    { ticket: registration.ticket, id: registration.id, activityTitle: activity.title },
    { status: 201 }
  );
}
