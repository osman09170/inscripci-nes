import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

async function getActivities() {
  return prisma.activity.findMany({
    include: {
      formConfig: true,
      _count: { select: { registrations: true } },
    },
    orderBy: { date: "asc" },
  });
}

export default async function ActivitiesPage() {
  const activities = await getActivities();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividades</h1>
          <p className="text-gray-500 mt-1">Gestiona los eventos e inscripciones</p>
        </div>
        <Link
          href="/admin/activities/new"
          className="inline-flex items-center gap-2 bg-[#2d1054] hover:bg-[#3d1f74] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Actividad
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-700">No hay actividades creadas</h3>
          <p className="text-gray-400 mt-1 mb-6">Crea la primera actividad para comenzar</p>
          <Link
            href="/admin/activities/new"
            className="inline-flex items-center gap-2 bg-[#2d1054] text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            Crear Actividad
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{activity.title}</h3>
                  {activity.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </div>
                <span
                  className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                    activity.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {activity.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(activity.date)}
                  {(activity as any).dateEnd && ` → ${formatDate((activity as any).dateEnd)}`}
                </div>
                {activity.location && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {activity.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" />
                  </svg>
                  {activity._count.registrations} inscritos
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Precio base</p>
                  <p className="font-bold text-green-700">{formatCurrency(Number(activity.basePrice))}</p>
                </div>
                <Link
                  href={`/admin/activities/${activity.id}`}
                  className="inline-flex items-center gap-1.5 bg-[#2d1054] hover:bg-[#3d1f74] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}