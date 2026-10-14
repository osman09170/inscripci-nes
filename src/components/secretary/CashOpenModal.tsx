"use client";

import { useState } from "react";

interface CashOpenModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CashOpenModal({ onClose, onSuccess }: CashOpenModalProps) {
  const [openingAmount, setOpeningAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/cash-shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingAmount: parseFloat(openingAmount) || 0 }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al abrir caja");
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 rounded-t-2xl text-white"
          style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2d1054 100%)", borderBottom: "1px solid rgba(201,168,76,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.2)", border: "1px solid rgba(201,168,76,0.4)" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#c9a84c" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Apertura de Caja</h2>
              <p className="text-sm" style={{ color: "rgba(201,168,76,0.7)" }}>Inicio de turno</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleOpen} className="p-6 space-y-5">
          <p className="text-gray-600 text-sm">
            Para comenzar a registrar inscripciones, debes abrir tu caja declarando el
            saldo inicial en efectivo.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Saldo Inicial en Efectivo
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Q</span>
              <input
                type="number"
                min="0"
                step="1"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-right font-mono text-lg"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Ingresa 0 si no tienes efectivo inicial
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-lg transition text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #2d1054, #3d1f74)" }}
          >
            {loading ? "Abriendo caja..." : "Abrir Caja y Comenzar Turno"}
          </button>
        </form>
      </div>
    </div>
  );
}
