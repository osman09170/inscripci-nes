import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ActivityStatusToggle } from "@/components/admin/ActivityStatusToggle";
import { ActivityDeleteButton } from "@/components/admin/ActivityDeleteButton";
import {
  ActivitySummaryChart,
  PaymentStatusChart,
  PaymentMethodChart,
  TransportChart,
  LodgingChart,
  MealsChart,
  ShirtSizeChart,
  AreasChart,
} from "@/components/admin/ActivityCharts";

async function getActivityStats(id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { formConfig: true },
  });
  if (!activity) return null;

  const registrations = await prisma.registration.findMany({
    where: { activityId: id, status: "CONFIRMED" },
    include: { payments: true },
  });

  const pending = await prisma.registration.count({ where: { activityId: id, status: "PENDING" } });

  const paid    = registrations.filter(r => r.paymentStatus === "PAID").length;
  const partial = registrations.filter(r => r.paymentStatus === "PARTIAL").length;
  const unpaid  = registrations.filter(r => r.paymentStatus === "UNPAID").length;

  const totalExpected  = registrations.reduce((s, r) => s + Number(r.totalAmount), 0);
  const totalCollected = registrations.reduce((s, r) => s + Number(r.totalPaid), 0);
  const wantsTransport = registrations.filter(r => r.wantsTransport).length;

  const shirtSizes: Record<string, number> = {};
  const areas: Record<string, number> = {};

  for (const r of registrations) {
    if (r.shirtSize) shirtSizes[r.shirtSize] = (shirtSizes[r.shirtSize] ?? 0) + 1;
    if (r.area)      areas[r.area]           = (areas[r.area] ?? 0) + 1;
  }

  let wantsLodging = 0;
  const lodgingTypes: Record<string, number> = {};
  let wantsMeals = 0;
  const mealTimes: Record<string, number> = { Desayuno: 0, Almuerzo: 0, Cena: 0 };

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
          const labels: Record<string, string> = { breakfast: "Desayuno", lunch: "Almuerzo", dinner: "Cena" };
          for (const t of (m.times ?? [])) {
            const label = labels[t] ?? t;
            mealTimes[label] = (mealTimes[label] ?? 0) + 1;
          }
        }
      } catch {}
    }
  }

  const methods: Record<string, number> = { CASH: 0, TRANSFER: 0, CARD: 0 };
  for (const r of registrations) {
    for (const p of r.payments) {
      methods[p.method] = (methods[p.method] ?? 0) + 1;
    }
  }

  const ages = registrations.map(r => r.age);
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

  return {
    activity,
    totals: { confirmed: registrations.length, pending, paid, partial, unpaid, totalExpected, totalCollected },
    transport: { wants: wantsTransport, noWants: registrations.length - wantsTransport },
    lodging:   { wants: wantsLodging,   noWants: registrations.length - wantsLodging, types: lodgingTypes },
    meals:     { wants: wantsMeals,     noWants: registrations.length - wantsMeals,   times: mealTimes },
    shirtSizes,
    areas,
    paymentMethods: methods,
    avgAge,
  };
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${color} p-5`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default async function ActivityDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getActivityStats(id);
  if (!data) notFound();

  const { activity, totals, transport, lodging, meals, shirtSizes, areas, paymentMethods, avgAge } = data;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/activities" className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              activity.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {activity.isActive ? "Activa" : "Cerrada"}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            {activity.date ? formatDate(activity.date) : ""}
            {activity.location ? ` · ${activity.location}` : ""}
            {` · Precio base: ${formatCurrency(Number(activity.basePrice))}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/activities/${activity.id}/edit`}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition text-white"
            style={{ background: "#2d1054" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
          <ActivityStatusToggle activityId={activity.id} isActive={activity.isActive} />
          <ActivityDeleteButton activityId={activity.id} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Confirmados" value={totals.confirmed} sub="Inscritos procesados" color="border-l-blue-500" />
        <StatCard label="En cola" value={totals.pending} sub="Sin confirmar aún" color="border-l-yellow-400" />
        <StatCard label="Recaudado" value={formatCurrency(totals.totalCollected)} sub={`de ${formatCurrency(totals.totalExpected)}`} color="border-l-green-500" />
        <StatCard label="Saldo pendiente" value={formatCurrency(totals.totalExpected - totals.totalCollected)} sub={`Edad prom. ${avgAge} años`} color="border-l-red-400" />
      </div>

      {totals.confirmed === 0 && totals.pending === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-600">Sin inscritos aún</h3>
          <p className="text-gray-400 mt-1 text-sm">Las estadísticas aparecerán aquí cuando haya inscripciones confirmadas</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Gráfica resumen — TODAS las categorías juntas */}
          <ChartCard title="Resumen General">
            <ActivitySummaryChart
              totals={totals}
              transport={transport}
              lodging={lodging}
              meals={meals}
            />
          </ChartCard>

          {/* Fila 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Estado de Pagos">
              <PaymentStatusChart totals={totals} />
            </ChartCard>
            <ChartCard title="Método de Pago">
              <PaymentMethodChart paymentMethods={paymentMethods} />
            </ChartCard>
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Transporte">
              <TransportChart transport={transport} />
            </ChartCard>
            <ChartCard title="Hospedaje">
              <LodgingChart lodging={lodging} />
            </ChartCard>
          </div>

          {/* Fila 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Alimentación">
              <MealsChart meals={meals} />
            </ChartCard>
            <ChartCard title="Tallas de Camisa">
              <ShirtSizeChart shirtSizes={shirtSizes} />
            </ChartCard>
          </div>

          {/* Áreas — solo si hay datos */}
          {Object.keys(areas).length > 0 && (
            <ChartCard title="Áreas / Ministerios">
              <AreasChart areas={areas} />
            </ChartCard>
          )}

        </div>
      )}
    </div>
  );
}
