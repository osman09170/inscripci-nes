"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  name: string;
  total: number;
  count?: number;
}

function formatGTQ(value: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(value);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-gray-800 mb-1 max-w-[160px] truncate">{label}</p>
        <p className="text-green-700 font-bold">{formatGTQ(payload[0].value)}</p>
        {payload[0].payload.count !== undefined && (
          <p className="text-gray-500">{payload[0].payload.count} inscritos</p>
        )}
      </div>
    );
  }
  return null;
};

export function DashboardCharts({
  data,
  type,
}: {
  data: ChartData[];
  type: "activity" | "secretary";
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>Sin datos disponibles</p>
      </div>
    );
  }

  const color = type === "activity" ? "#3b82f6" : "#8b5cf6";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          interval={0}
          width={60}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) =>
            v >= 1_000_000
              ? `Q${(v / 1_000_000).toFixed(1)}M`
              : v >= 1_000
              ? `Q${(v / 1_000).toFixed(0)}K`
              : `$${v}`
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} maxBarSize={60} />
      </BarChart>
    </ResponsiveContainer>
  );
}