"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, calculateTotal, PAYMENT_METHOD_LABELS } from "@/lib/utils";

interface PendingReg {
  id: string;
  ticket: string;
  fullName: string;
  age: number;
  shirtSize?: string;
  area?: string;
  wantsTransport: boolean;
  transportRoute?: string;
  lodging?: { needed: boolean; type?: string };
  meals?: { needed: boolean; times: string[] };
  notes?: string;
  totalAmount: number;
  createdAt: string;
  activity: {
    title: string;
    basePrice: number;
    formConfig: {
      pricingConfig: any;
    } | null;
  };
}

function ConfirmModal({
  reg,
  onClose,
  onSuccess,
}: {
  reg: PendingReg;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [method, setMethod] = useState<"CASH" | "TRANSFER" | "CARD">("CASH");
  const [reference, setReference] = useState("");
  const [isAbono, setIsAbono] = useState(false);
  const [abonoAmount, setAbonoAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { ticket: string; total: number; paid: number }>(null);

  const pricingConfig = reg.activity.formConfig?.pricingConfig ?? {};
  const total = calculateTotal(
    Number(reg.activity.basePrice),
    {
      transport: { needed: reg.wantsTransport },
      lodging: reg.lodging ?? undefined,
      meals: reg.meals ?? undefined,
    },
    pricingConfig
  );

  const amountPaid = isAbono ? (parseFloat(abonoAmount) || 0) : total;

  async function handleConfirm() {
    if (isAbono && (!abonoAmount || parseFloat(abonoAmount) <= 0)) {
      setError("Ingresa el monto del abono");
      return;
    }
    if (isAbono && parseFloat(abonoAmount) > total) {
      setError("El abono no puede ser mayor al total");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/registrations/${reg.id}/confirm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod: method,
        paymentReference: reference || undefined,
        totalAmount: total,
        amountPaid,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al confirmar"); setLoading(false); return; }
    setDone({ ticket: reg.ticket, total, paid: amountPaid });
    setLoading(false);
  }

  if (done) {
    const isPaid = done.paid >= done.total;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isPaid ? "bg-green-100" : "bg-yellow-100"}`}>
            {isPaid ? (
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {isPaid ? "Inscripción Confirmada" : "Abono Registrado"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">{reg.fullName}</p>
          <div className="bg-gray-50 rounded-xl p-5 mb-6 border-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Ticket</p>
            <p className="text-2xl font-mono font-bold text-blue-700 tracking-wider">{done.ticket}</p>
            <p className="text-xl font-bold text-green-700 mt-3">{formatCurrency(done.paid)}</p>
            {!isPaid && (
              <p className="text-sm text-yellow-600 mt-1">
                Pendiente: {formatCurrency(done.total - done.paid)}
              </p>
            )}
          </div>
          <button onClick={() => { onSuccess(); onClose(); }}
            className="w-full py-2.5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition">
            Siguiente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{reg.fullName}</h2>
              <p className="text-sm text-gray-400">{reg.activity.title} · Ticket: {reg.ticket}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Resumen de datos */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-400">Edad:</span> <span className="font-medium">{reg.age} años</span></div>
              {reg.shirtSize && <div><span className="text-gray-400">Talla:</span> <span className="font-medium">{reg.shirtSize}</span></div>}
              {reg.area && <div><span className="text-gray-400">Área:</span> <span className="font-medium">{reg.area}</span></div>}
              {reg.wantsTransport && (
                <div><span className="text-gray-400">Transporte:</span> <span className="font-medium text-green-700">Sí {reg.transportRoute ? `· ${reg.transportRoute}` : ""}</span></div>
              )}
              {reg.lodging?.needed && (
                <div><span className="text-gray-400">Hospedaje:</span> <span className="font-medium text-green-700">Sí</span></div>
              )}
              {reg.meals?.needed && (
                <div><span className="text-gray-400">Alimentación:</span> <span className="font-medium text-green-700">Sí</span></div>
              )}
              {reg.notes && (
                <div className="col-span-2"><span className="text-gray-400">Notas:</span> <span className="font-medium">{reg.notes}</span></div>
              )}
            </div>
          </div>

          {/* Toggle pago completo / abono */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Tipo de pago</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setIsAbono(false)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition ${!isAbono ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"}`}>
                💰 Pago completo
              </button>
              <button type="button" onClick={() => setIsAbono(true)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition ${isAbono ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-200 text-gray-600"}`}>
                📅 Abono parcial
              </button>
            </div>
            {isAbono && (
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">Monto del abono (Q)</label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  max={total}
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                  placeholder={`Máx. ${formatCurrency(total)}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {abonoAmount && parseFloat(abonoAmount) < total && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Pendiente: {formatCurrency(total - (parseFloat(abonoAmount) || 0))}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {(["CASH", "TRANSFER", "CARD"] as const).map((m) => {
                const icons = { CASH: "💵", TRANSFER: "📱", CARD: "💳" };
                return (
                  <button key={m} type="button" onClick={() => setMethod(m)}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition flex flex-col items-center gap-1 ${method === m ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
                    <span className="text-lg">{icons[m]}</span>
                    {PAYMENT_METHOD_LABELS[m]}
                  </button>
                );
              })}
            </div>
            {method === "TRANSFER" && (
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
                className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número de referencia de transferencia" />
            )}
          </div>

          {/* Total */}
          <div className={`rounded-xl p-4 flex items-center justify-between text-white ${isAbono ? "bg-yellow-500" : "bg-blue-700"}`}>
            <div>
              <span className={isAbono ? "text-yellow-100" : "text-blue-200"}>
                {isAbono ? "Abono a cobrar" : "Total a cobrar"}
              </span>
              {isAbono && (
                <p className={`text-xs mt-0.5 ${isAbono ? "text-yellow-100" : "text-blue-100"}`}>
                  Total inscripción: {formatCurrency(total)}
                </p>
              )}
            </div>
            <span className="text-2xl font-bold">{formatCurrency(amountPaid)}</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <button onClick={handleConfirm} disabled={loading}
            className={`w-full py-3 disabled:opacity-40 text-white font-bold rounded-xl transition ${isAbono ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"}`}>
            {loading ? "Procesando..." : isAbono
              ? `Registrar abono ${formatCurrency(amountPaid)}`
              : `Confirmar y cobrar ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PendingQueue() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingReg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingReg | null>(null);

  const fetchPending = useCallback(async () => {
    const res = await fetch("/api/registrations/pending");
    if (res.ok) {
      const data = await res.json();
      setPending(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 8000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Cargando cola...
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-500">Actualización automática cada 8s</span>
        </div>
        <button onClick={fetchPending} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-600">Sin formularios pendientes</h3>
          <p className="text-gray-400 mt-1 text-sm">
            Cuando alguien llene el formulario en el tablet aparecerá aquí
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((reg, idx) => (
            <div key={reg.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center shrink-0">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{reg.fullName}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {reg.age} años
                  </span>
                  {reg.shirtSize && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      Talla {reg.shirtSize}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{reg.activity.title}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  {reg.wantsTransport && <span>🚌 Transporte{reg.transportRoute ? ` · ${reg.transportRoute}` : ""}</span>}
                  {reg.lodging?.needed && <span>🏕️ Hospedaje</span>}
                  {reg.meals?.needed && <span>🍽️ Alimentación</span>}
                  {reg.area && <span>📌 {reg.area}</span>}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-green-700">{formatCurrency(Number(reg.totalAmount))}</p>
                <p className="text-xs text-gray-400 mb-3">total</p>
                <button
                  onClick={() => setSelected(reg)}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
                  Atender
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <ConfirmModal
          reg={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { fetchPending(); router.refresh(); }}
        />
      )}
    </>
  );
}
