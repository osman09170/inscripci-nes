import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Image from "next/image";

async function getActivities() {
  const activities = await prisma.activity.findMany({
    where: { isActive: true },
    select: { id: true, title: true, description: true, date: true, location: true, basePrice: true },
    orderBy: { date: "asc" },
  });
  return activities;
}

export default async function FormIndexPage() {
  const activities = await getActivities();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2d1054 50%, #1a0a2e 100%)" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg"
          style={{ border: "2px solid rgba(201,168,76,0.5)" }}>
          <Image src="/logo.png" alt="Juventud Palabra Miel" width={96} height={96}
            className="object-cover w-full h-full" priority />
        </div>
        <h1 className="text-3xl font-bold text-white">Juventud Palabra Miel</h1>
        <p className="text-[#c9a84c] text-sm mt-1 tracking-widest uppercase">Inscripciones</p>
      </div>

      <div className="w-full max-w-xl">
        <h2 className="text-xl font-semibold text-white text-center mb-2">
          Selecciona la actividad
        </h2>
        <p className="text-purple-300/60 text-center text-sm mb-8">
          Elige el evento en el que deseas inscribirte
        </p>

        {activities.length === 0 ? (
          <div className="text-center text-purple-300/50 py-16">
            <p className="text-lg">No hay actividades disponibles en este momento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((act) => (
              <Link key={act.id} href={`/form/${act.id}`}
                className="block w-full rounded-2xl p-6 transition-all active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(201,168,76,0.25)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white">{act.title}</h3>
                    {act.description && (
                      <p className="text-purple-300/70 text-sm mt-1">{act.description}</p>
                    )}
                    <div className="flex gap-4 mt-3 text-sm text-purple-300/60">
                      <span>📅 {formatDate(act.date)}</span>
                      {act.location && <span>📍 {act.location}</span>}
                    </div>
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <p className="text-xs text-purple-300/50 mb-0.5">Desde</p>
                    <p className="text-2xl font-bold text-[#c9a84c]">
                      {formatCurrency(Number(act.basePrice))}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 text-[#c9a84c] text-sm font-medium">
                  Inscribirme
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="mt-12 text-[#c9a84c]/30 text-xs">© Powered by LDT</p>
    </div>
  );
}
