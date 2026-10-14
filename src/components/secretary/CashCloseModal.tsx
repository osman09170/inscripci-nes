"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface CashCloseModalProps {
  shiftId: string;
  totalCollected: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CashCloseModal({
  shiftId,
  totalCollected,
  onClose,
  onSuccess,
}: CashCloseModalProps) {
  const [cashAmount, setCashAmount] = useState("0");
  const [transferAmount, setTransferAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    expectedAmount: number;
    difference: number;
  }>(null);

  const physicalTotal = (parseFloat(cashAmount) || 0) + (parseFloat(transferAmount) || 0);
  const estimatedDiff = physicalTotal - totalCollected;

  async function handleClose(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/cash-shifts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId,
        closingCashAmount: parseFloat(cashAmount) || 0,
        closingTransferAmount: parseFloat(transferAmount) || 0,
        closingNotes: notes,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setResult({
        expectedAmount: Number(data.expectedAmount),
        difference: Number(data.difference),
      });
    }
    setLoading(false);
  }

  if (result) {
    const isExact = result.difference === 0;
    const isSurplus = result.difference > 0;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md text-center p-8">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isExact
                ? "bg-green-100 text-green-600"
                : isSurplus
                ? "bg-purple-100 text-purple-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            {isExact ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {isExact ? "¡Caja Cuadrada!" : isSurplus ? "Sobrante en Caja" : "Faltante en Caja"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {isExact
              ? "El monto físico coincide perfectamente con el sistema."
              : isSurplus
              ? "Tienes más efectivo del esperado."
              : "Hay una diferencia negativa. Verifica los cobros."}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Esperado por sistema:</span>
              <span className="font-semibold">{formatCurrency(result.expectedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Contado físicamente:</span>
              <span className="font-semibold">{formatCurrency(physicalTotal)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-medium text-gray-700">Diferencia:</span>
              <span
                className={`font-bold text-base ${
                  isExact ? "text-green-600" : isSurplus ? "text-blue-600" : "text-red-600"
                }`}
              >
                {result.difference >= 0 ? "+" : ""}
                {formatCurrency(result.difference)}
              </span>
            </div>
          </div>

          <button
            onClick={onSuccess}
            className="w-full py-2.5 text-white font-semibold rounded-lg transition"
            style={{ background: "linear-gradient(135deg, #2d1054, #3d1f74)" }}
          >
            Finalizar y Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-5 bg-gradient-to-r from-orange-600 to-orange-700 rounded-t-2xl text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Cierre de Caja</h2>
              <p className="text-orange-100 text-sm">Cuadre de turno</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleClose} className="p-6 space-y-5">
          {/* Resumen del sistema */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm font-medium text-orange-800 mb-2">
              Resumen del turno (según el sistema)
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">Total registrado:</span>
              <span className="font-bold text-orange-900 text-lg">
                {formatCurrency(totalCollected)}
              </span>
            </div>
          </div>

          <div className="text-sm font-medium text-gray-700 mb-1">
            Ingresa el monto físico contado
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                Efectivo contado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Q</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-right"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                Transferencias
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Q</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-right"
                />
              </div>
            </div>
          </div>

          {/* Diferencia en tiempo real */}
          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">Total contado:</span>
            <div className="text-right">
              <span className="font-bold text-gray-900">{formatCurrency(physicalTotal)}</span>
              {physicalTotal !== totalCollected && (
                <span
                  className={`ml-2 text-xs font-medium ${
                    estimatedDiff >= 0 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  ({estimatedDiff >= 0 ? "+" : ""}
                  {formatCurrency(estimatedDiff)})
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Observaciones del turno..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-sm font-semibold rounded-lg transition"
            >
              {loading ? "Procesando..." : "Cerrar Caja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}