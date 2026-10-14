import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS } from "@/lib/utils";

async function getCashShifts() {
  return prisma.cashShift.findMany({
    include: {
      user: { select: { name: true } },
      payments: true,
    },
    orderBy: { openedAt: "desc" },
    take: 50,
  });
}

export default async function ReportsPage() {
  const shifts = await getCashShifts();

  const closedShifts = shifts.filter((s) => s.status === "CLOSED");
  const openShifts = shifts.filter((s) => s.status === "OPEN");

  const totalRecaudado = closedShifts.reduce(
    (sum, s) => sum + s.payments.reduce((p, pay) => p + Number(pay.amount), 0),
    0
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reportes de Caja</h1>
        <p className="text-gray-500 mt-1">Auditoría de turnos y cuadres de caja</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-green-500 p-5">
          <p className="text-sm text-gray-500">Total Recaudado (turnos cerrados)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRecaudado)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-blue-500 p-5">
          <p className="text-sm text-gray-500">Turnos Cerrados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{closedShifts.length}</p>
        </div>
        <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${openShifts.length > 0 ? "border-l-orange-500" : "border-l-gray-300"} p-5`}>
          <p className="text-sm text-gray-500">Turnos Activos Ahora</p>
          <p className={`text-2xl font-bold mt-1 ${openShifts.length > 0 ? "text-orange-600" : "text-gray-400"}`}>
            {openShifts.length}
          </p>
        </div>
      </div>

      {/* Tabla de turnos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Historial de Turnos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secretaria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apertura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cierre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Esperado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shifts.map((shift) => {
                const totalCobrado = shift.payments.reduce((s, p) => s + Number(p.amount), 0);
                const diff = shift.difference !== null ? Number(shift.difference) : null;
                return (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{shift.user.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDateTime(shift.openedAt)}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {shift.closedAt ? formatDateTime(shift.closedAt) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-700">
                      {shift.expectedAmount !== null
                        ? formatCurrency(Number(shift.expectedAmount))
                        : formatCurrency(totalCobrado)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-700">
                      {shift.closingCashAmount !== null
                        ? formatCurrency(
                            Number(shift.closingCashAmount) + Number(shift.closingTransferAmount ?? 0)
                          )
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {diff !== null ? (
                        <span
                          className={`font-semibold ${
                            diff > 0
                              ? "text-green-600"
                              : diff < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {formatCurrency(diff)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          shift.status === "OPEN"
                            ? "bg-orange-100 text-orange-700"
                            : diff === 0
                            ? "bg-green-100 text-green-700"
                            : diff !== null && diff < 0
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {shift.status === "OPEN"
                          ? "Abierto"
                          : diff === 0
                          ? "Cuadrado"
                          : diff !== null && diff < 0
                          ? "Faltante"
                          : "Sobrante"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shifts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No hay turnos registrados aún
            </div>
          )}
        </div>
      </div>
    </div>
  );
}