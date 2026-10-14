import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicRegistrationForm } from "@/components/public/PublicRegistrationForm";
import Image from "next/image";
import Link from "next/link";

async function getActivity(id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id, isActive: true },
    include: { formConfig: true },
  });
  if (!activity) return null;
  return {
    ...activity,
    basePrice: Number(activity.basePrice),
    formConfig: activity.formConfig
      ? {
          fieldsConfig:  JSON.parse(activity.formConfig.fieldsConfig as string),
          pricingConfig: JSON.parse(activity.formConfig.pricingConfig as string),
        }
      : null,
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const activity = await getActivity(activityId);
  if (!activity) notFound();

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #1a0a2e 0%, #2d1054 60%, #1a0a2e 100%)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}
      >
        <Link href="/form" className="flex items-center gap-2 text-purple-300/60 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Volver</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(201,168,76,0.4)" }}>
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Juventud Palabra Miel</p>
            <p className="text-[#c9a84c] text-xs">Inscripciones</p>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
        {/* Info de la actividad */}
        <div className="rounded-2xl p-5 mb-6"
          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <h1 className="text-2xl font-bold text-white">{activity.title}</h1>
          {activity.description && (
            <p className="text-purple-300/70 text-sm mt-1">{activity.description}</p>
          )}
          {activity.location && (
            <p className="text-purple-300/60 text-sm mt-2">📍 {activity.location}</p>
          )}
        </div>

        <PublicRegistrationForm activity={activity as any} />
      </div>

      <p className="text-center text-[#c9a84c]/30 text-xs py-4">© Powered by LDT</p>
    </div>
  );
}
