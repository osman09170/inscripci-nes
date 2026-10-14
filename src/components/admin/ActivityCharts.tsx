"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";

interface Props {
  totals: { confirmed: number; paid: number; partial: number; unpaid: number };
  transport: { wants: number; noWants: number };
  lodging: { wants: number; noWants: number; types: Record<string, number> };
  meals: { wants: number; noWants: number; times: Record<string, number> };
  shirtSizes: Record<string, number>;
  areas: Record<string, number>;
  paymentMethods: Record<string, number>;
}

const SHIRT_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
const METHOD_LABELS: Record<string, string> = { CASH: "Efectivo", TRANSFER: "Transferencia", CARD: "Tarjeta" };
const MEAL_LABELS: Record<string, string> = { Desayuno: "Desayuno", Almuerzo: "Almuerzo", Cena: "Cena" };

function MiniChart({
  data,
  color,
  height = 200,
}: {
  data: { name: string; value: number }[];
  color: string | ((name: string) => string);
  height?: number;
}) {
  if (data.every(d => d.value === 0)) {
    return <p className="text-sm text-gray-400 py-6 text-center">Sin datos aún</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
                <p className="font-semibold text-gray-700">{label}</p>
                <p className="text-blue-700 font-bold">{payload[0].value} personas</p>
              </div>
            ) : null
          }
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
          <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600, fill: "#374151" }} />
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={typeof color === "function" ? color(entry.name) : color}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActivitySummaryChart({ totals, transport, lodging, meals }: Pick<Props, "totals" | "transport" | "lodging" | "meals">) {
  const data = [
    { name: "Inscritos", value: totals.confirmed, fill: "#3b82f6" },
    { name: "Pagado", value: totals.paid, fill: "#22c55e" },
    { name: "Abono", value: totals.partial, fill: "#eab308" },
    { name: "Sin pagar", value: totals.unpaid, fill: "#9ca3af" },
    { name: "Transporte", value: transport.wants, fill: "#6366f1" },
    { name: "Hospedaje", value: lodging.wants, fill: "#8b5cf6" },
    { name: "Alimentación", value: meals.wants, fill: "#f97316" },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 24, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#374151" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
                <p className="font-semibold text-gray-700">{label}</p>
                <p className="font-bold" style={{ color: payload[0].payload.fill }}>{payload[0].value} personas</p>
              </div>
            ) : null
          }
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={70}>
          <LabelList dataKey="value" position="top" style={{ fontSize: 13, fontWeight: 700, fill: "#374151" }} />
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PaymentStatusChart({ totals }: Pick<Props, "totals">) {
  const data = [
    { name: "Pagado", value: totals.paid },
    { name: "Abono", value: totals.partial },
    { name: "Sin pagar", value: totals.unpaid },
  ];
  const colors = (name: string) =>
    name === "Pagado" ? "#22c55e" : name === "Abono" ? "#eab308" : "#9ca3af";
  return <MiniChart data={data} color={colors} />;
}

export function PaymentMethodChart({ paymentMethods }: Pick<Props, "paymentMethods">) {
  const data = Object.entries(paymentMethods)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: METHOD_LABELS[k] ?? k, value: v }));
  const colors = (name: string) =>
    name === "Efectivo" ? "#22c55e" : name === "Transferencia" ? "#3b82f6" : "#8b5cf6";
  return <MiniChart data={data} color={colors} />;
}

export function TransportChart({ transport }: Pick<Props, "transport">) {
  const data = [
    { name: "Con transporte", value: transport.wants },
    { name: "Sin transporte", value: transport.noWants },
  ];
  const colors = (name: string) => name === "Con transporte" ? "#6366f1" : "#e5e7eb";
  return <MiniChart data={data} color={colors} />;
}

export function LodgingChart({ lodging }: Pick<Props, "lodging">) {
  const base = [
    { name: "Con hospedaje", value: lodging.wants },
    { name: "Sin hospedaje", value: lodging.noWants },
  ];
  const types = Object.entries(lodging.types).map(([k, v]) => ({ name: k, value: v }));
  const data = [...base, ...types];
  return <MiniChart data={data} color="#8b5cf6" />;
}

export function MealsChart({ meals }: Pick<Props, "meals">) {
  const times = Object.entries(meals.times)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: MEAL_LABELS[k] ?? k, value: v }));
  const data = [
    { name: "Con aliment.", value: meals.wants },
    { name: "Sin aliment.", value: meals.noWants },
    ...times,
  ];
  const colors = (name: string) => {
    if (name === "Con aliment.") return "#f97316";
    if (name === "Sin aliment.") return "#e5e7eb";
    return "#fed7aa";
  };
  return <MiniChart data={data} color={colors} />;
}

export function ShirtSizeChart({ shirtSizes }: Pick<Props, "shirtSizes">) {
  const data = SHIRT_ORDER
    .filter(s => shirtSizes[s])
    .map(s => ({ name: s, value: shirtSizes[s] }));
  return <MiniChart data={data} color="#a855f7" height={180} />;
}

export function AreasChart({ areas }: Pick<Props, "areas">) {
  const data = Object.entries(areas)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ name: k, value: v }));
  if (data.length === 0) return <p className="text-sm text-gray-400 py-6 text-center">Sin datos aún</p>;
  return <MiniChart data={data} color="#14b8a6" height={200} />;
}
