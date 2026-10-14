import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ActivityEditForm } from "@/components/admin/ActivityEditForm";

export default async function ActivityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { formConfig: true },
  });

  if (!activity) notFound();

  const fieldsConfig = activity.formConfig?.fieldsConfig
    ? JSON.parse(activity.formConfig.fieldsConfig as string)
    : {};
  const pricingConfig = activity.formConfig?.pricingConfig
    ? JSON.parse(activity.formConfig.pricingConfig as string)
    : {};

  const initialData = {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    location: activity.location,
    basePrice: Number(activity.basePrice),
    date: activity.date.toISOString(),
    dateEnd: (activity as any).dateEnd ? (activity as any).dateEnd.toISOString() : null,
    fieldsConfig,
    pricingConfig,
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/activities/${id}`}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Actividad</h1>
          <p className="text-gray-400 text-sm">{activity.title}</p>
        </div>
      </div>

      <ActivityEditForm data={initialData} />
    </div>
  );
}
