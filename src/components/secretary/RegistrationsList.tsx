"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/lib/utils";

interface ConfirmedReg {
  id: string;
  ticket: string;
  fullName: string;
  age: number;
  shirtSize?: string;
  area?: string;
  wantsTransport: boolean;
  transportRoute?: string;
  notes?: string;
  totalAmount: number;
  totalPaid: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  createdAt: string;
  activity: { id: string; title: string };
  payments: {
    id: string;
    amount: number;
    method: string;
    isAbono: boolean;
    confirmedAt: string;
  }[];
}

function AbonoModal({
  reg,
  onClose,
  onSuccess,
}: {
  reg: ConfirmedReg;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "TRANSFER" | "CARD">("CASH");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remaining = Number(reg.totalAmount) - Number(reg.totalPaid);

  async function handleAbono() {
    const val = parseFloat(amount);
    if (!val || val <= 0) { setError("Ingresa un monto válido"); return; }
    if (val > remaining) { setError(`El monto no puede superar el saldo pendiente (${formatCurrency(remaining)})`); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/registrations/${reg.id}/abono`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: val, method, reference: reference || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al registrar abono"); setLoading(false); return; }
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Registrar Abono</h2>
            <p className="text-sm text-gray-400">{reg.fullName} · {reg.ticket}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total inscripción</span>
              <span className="font-semibold">{formatCurrency(Number(reg.totalAmount))}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Ya pagado</span>
              <span className="font-semibold text-green-700">{formatCurrency(Number(reg.totalPaid))}</span>
            </div>
            <div className="flex justify-between text-sm mt-1 font-bold border-t border-yellow-200 pt-2">
              <span className="text-yellow-700">Saldo pendiente</span>
              <span className="text-yellow-700">{formatCurrency(remaining)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Monto del abono (Q)</label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Máx. ${formatCurrency(remaining)}`}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {(["CASH", "TRANSFER", "CARD"] as const).map((m) => {
                const icons = { CASH: "💵", TRANSFER: "📱", CARD: "💳" };
                return (
                  <button key={m} type="button" onClick={() => setMethod(m)}
                    className={`py-2 rounded-xl text-sm font-medium border-2 transition flex flex-col items-center gap-1 ${method === m ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
                    <span>{icons[m]}</span>
                    {PAYMENT_METHOD_LABELS[m]}
                  </button>
                );
              })}
            </div>
            {method === "TRANSFER" && (
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número de referencia" />
            )}
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

          <button onClick={handleAbono} disabled={loading}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-white font-bold rounded-xl transition">
            {loading ? "Procesando..." : `Registrar abono ${amount ? formatCurrency(parseFloat(amount) || 0) : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  PAID:    { label: "Pagado",         bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  PARTIAL: { label: "Abono parcial",  bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  UNPAID:  { label: "Sin pagar",      bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400"   },
};

export function RegistrationsList() {
  const router = useRouter();
  const [regs, setRegs] = useState<ConfirmedReg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "PARTIAL" | "UNPAID">("ALL");
  const [abonoTarget, setAbonoTarget] = useState<ConfirmedReg | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchRegs = useCallback(async () => {
    const url = filter === "ALL"
      ? "/api/registrations/confirmed"
      : `/api/registrations/confirmed?paymentStatus=${filter}`;
    const res = await fetch(url);
    if (res.ok) setRegs(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchRegs();
  }, [fetchRegs]);

  const counts = {
    ALL:     regs.length,
    PAID:    regs.filter((r) => r.paymentStatus === "PAID").length,
    PARTIAL: regs.filter((r) => r.paymentStatus === "PARTIAL").length,
    UNPAID:  regs.filter((r) => r.paymentStatus === "UNPAID").length,
  };

  return (
    <>
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(["ALL", "PAID", "PARTIAL", "UNPAID"] as const).map((f) => {
          const labels = { ALL: "Todos", PAID: "Pagados", PARTIAL: "Con abono", UNPAID: "Sin pagar" };
          const colors = {
            ALL:     filter === f ? "bg-blue-700 text-white" : "bg-white text-gray-600 border-gray-200",
            PAID:    filter === f ? "bg-green-600 text-white" : "bg-white text-gray-600 border-gray-200",
            PARTIAL: filter === f ? "bg-yellow-500 text-white" : "bg-white text-gray-600 border-gray-200",
            UNPAID:  filter === f ? "bg-gray-600 text-white" : "bg-white text-gray-600 border-gray-200",
          };
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${colors[f]}`}>
              {labels[f]}
              {filter !== "ALL" && f !== "ALL" ? null : (
                <span className="ml-1.5 opacity-70">
                  {f === "ALL" ? regs.length : counts[f]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Cargando...
        </div>
      ) : regs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">🗂️</div>
          <h3 className="text-lg font-semibold text-gray-600">Sin inscritos</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {regs.map((reg) => {
            const sc = STATUS_CONFIG[reg.paymentStatus];
            const isExpanded = expanded === reg.id;
            const remaining = Number(reg.totalAmount) - Number(reg.totalPaid);
            return (
              <div key={reg.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : reg.id)}>
                  {/* Estado dot */}
                  <div className={`w-3 h-3 rounded-full shrink-0 ${sc.dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{reg.fullName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{reg.activity.title} · Ticket: <span className="font-mono">{reg.ticket}</span></p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">{formatCurrency(Number(reg.totalPaid))}</p>
                    <p className="text-xs text-gray-400">de {formatCurrency(Number(reg.totalAmount))}</p>
                  </div>

                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
                    {/* Detalle */}
                    <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-xl p-3">
                      <div><span className="text-gray-400">Edad:</span> {reg.age} años</div>
                      {reg.shirtSize && <div><span className="text-gray-400">Talla:</span> {reg.shirtSize}</div>}
                      {reg.area && <div><span className="text-gray-400">Área:</span> {reg.area}</div>}
                      {reg.wantsTransport && (
                        <div><span className="text-gray-400">Transporte:</span> <span className="text-green-700">Sí {reg.transportRoute ? `· ${reg.transportRoute}` : ""}</span></div>
                      )}
                    </div>

                    {/* Historial de pagos */}
                    {reg.payments.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pagos registrados</p>
                        <div className="space-y-1">
                          {reg.payments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span>{p.method === "CASH" ? "💵" : p.method === "TRANSFER" ? "📱" : "💳"}</span>
                                <span className="text-gray-600">{PAYMENT_METHOD_LABELS[p.method]}</span>
                                {p.isAbono && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">Abono</span>}
                              </div>
                              <span className="font-semibold text-green-700">{formatCurrency(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Saldo pendiente + botón abono */}
                    {reg.paymentStatus !== "PAID" && (
                      <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Saldo pendiente</p>
                          <p className="text-xl font-bold text-yellow-700">{formatCurrency(remaining)}</p>
                        </div>
                        <button
                          onClick={() => setAbonoTarget(reg)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition">
                          + Abono
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {abonoTarget && (
        <AbonoModal
          reg={abonoTarget}
          onClose={() => setAbonoTarget(null)}
          onSuccess={() => { fetchRegs(); setAbonoTarget(null); router.refresh(); }}
        />
      )}
    </>
  );
}
