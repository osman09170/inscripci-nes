import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { formConfig: true },
  });
  if (!activity) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const registrations = await prisma.registration.findMany({
    where: { activityId: id, status: "CONFIRMED" },
    include: { payments: true },
  });

  const pending = await prisma.registration.count({ where: { activityId: id, status: "PENDING" } });

  // Payment status
  const paid = registrations.filter(r => r.paymentStatus === "PAID").length;
  const partial = registrations.filter(r => r.paymentStatus === "PARTIAL").length;
  const unpaid = registrations.filter(r => r.paymentStatus === "UNPAID").length;

  // Revenue
  const totalExpected = registrations.reduce((s, r) => s + Number(r.totalAmount), 0);
  const totalCollected = registrations.reduce((s, r) => s + Number(r.totalPaid), 0);

  // Transport
  const wantsTransport = registrations.filter(r => r.wantsTransport).length;

  // Shirt sizes
  const shirtSizes: Record<string, number> = {};
  for (const r of registrations) {
    if (r.shirtSize) shirtSizes[r.shirtSize] = (shirtSizes[r.shirtSize] ?? 0) + 1;
  }

  // Areas
  const areas: Record<string, number> = {};
  for (const r of registrations) {
    if (r.area) areas[r.area] = (areas[r.area] ?? 0) + 1;
  }

  // Lodging & meals (stored as JSON strings)
  let wantsLodging = 0;
  const lodgingTypes: Record<string, number> = {};
  let wantsMeals = 0;
  const mealTimes: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0 };

  for (const r of registrations) {
    if (r.lodging) {
      try {
        const l = JSON.parse(r.lodging as string);
        if (l.needed) {
          wantsLodging++;
          if (l.type) lodgingTypes[l.type] = (lodgingTypes[l.type] ?? 0) + 1;
        }
      } catch {}
    }
    if (r.meals) {
      try {
        const m = JSON.parse(r.meals as string);
        if (m.needed) {
          wantsMeals++;
          for (const t of (m.times ?? [])) {
            mealTimes[t] = (mealTimes[t] ?? 0) + 1;
          }
        }
      } catch {}
    }
  }

  // Payment methods
  const methods: Record<string, number> = {};
  for (const r of registrations) {
    for (const p of r.payments) {
      methods[p.method] = (methods[p.method] ?? 0) + 1;
    }
  }

  // Age distribution
  const ages = registrations.map(r => r.age);
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

  return NextResponse.json({
    activity: {
      id: activity.id,
      title: activity.title,
      date: activity.date,
      location: activity.location,
      basePrice: Number(activity.basePrice),
      formConfig: activity.formConfig ? {
        fieldsConfig: JSON.parse(activity.formConfig.fieldsConfig as string),
        pricingConfig: JSON.parse(activity.formConfig.pricingConfig as string),
      } : null,
    },
    totals: {
      confirmed: registrations.length,
      pending,
      paid,
      partial,
      unpaid,
      totalExpected,
      totalCollected,
      totalPending: totalExpected - totalCollected,
    },
    transport: { wants: wantsTransport, noWants: registrations.length - wantsTransport },
    lodging: { wants: wantsLodging, noWants: registrations.length - wantsLodging, types: lodgingTypes },
    meals: { wants: wantsMeals, noWants: registrations.length - wantsMeals, times: mealTimes },
    shirtSizes,
    areas,
    paymentMethods: methods,
    avgAge,
  });
}
