import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/activities — Sin autenticación, para los tablets
export async function GET() {
  const activities = await prisma.activity.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      location: true,
      basePrice: true,
      formConfig: {
        select: { fieldsConfig: true, pricingConfig: true },
      },
    },
    orderBy: { date: "asc" },
  });

  const parsed = activities.map((a) => ({
    ...a,
    formConfig: a.formConfig
      ? {
          fieldsConfig: JSON.parse(a.formConfig.fieldsConfig as string),
          pricingConfig: JSON.parse(a.formConfig.pricingConfig as string),
        }
      : null,
  }));

  return NextResponse.json(parsed);
}
