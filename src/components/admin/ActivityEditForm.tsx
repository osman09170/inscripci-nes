"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FieldToggle {
  enabled: boolean;
  required: boolean;
  options?: string;
}

interface InitialData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  basePrice: number;
  date: string;       // ISO date string YYYY-MM-DD
  dateEnd?: string | null;
  fieldsConfig: Record<string, any>;
  pricingConfig: Record<string, any>;
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ActivityEditForm({ data }: { data: InitialData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fc = data.fieldsConfig;
  const pc = data.pricingConfig;

  const [title, setTitle] = useState(data.title);
  const [description, setDescription] = useState(data.description ?? "");
  const [location, setLocation] = useState(data.location ?? "");
  const [basePrice, setBasePrice] = useState(String(data.basePrice));

  const [multiDay, setMultiDay] = useState(!!data.dateEnd);
  const [date, setDate] = useState(toDateInput(data.date));
  const [dateEnd, setDateEnd] = useState(toDateInput(data.dateEnd));

  const [fields, setFields] = useState<Record<string, FieldToggle>>({
    shirtSize: { enabled: !!fc.shirtSize?.enabled, required: !!fc.shirtSize?.required },
    area:      { enabled: !!fc.area?.enabled,      required: !!fc.area?.required,
                 options: fc.area?.options?.join(", ") ?? "" },
    transport: { enabled: !!fc.transport?.enabled, required: !!fc.transport?.required },
    lodging:   { enabled: !!fc.lodging?.enabled,   required: !!fc.lodging?.required },
    meals:     { enabled: !!fc.meals?.enabled,     required: !!fc.meals?.required },
  });

  const [prices, setPrices] = useState({
    transport: String(pc.transport?.price ?? 0),
    lodging:   String(pc.lodging?.price   ?? 0),
    meals:     String(pc.meals?.price     ?? 0),
  });

  function updateField(name: string, updates: Partial<FieldToggle>) {
    setFields(prev => ({ ...prev, [name]: { ...prev[name], ...updates } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { setError("La fecha es obligatoria"); return; }
    if (multiDay && !dateEnd) { setError("Ingresa la fecha final"); return; }
    if (multiDay && dateEnd < date) { setError("La fecha final debe ser posterior a la inicial"); return; }

    setLoading(true);
    setError("");

    const fieldsConfig: Record<string, any> = {};
    if (fields.shirtSize.enabled) fieldsConfig.shirtSize = { enabled: true, required: fields.shirtSize.required };
    if (fields.area.enabled) fieldsConfig.area = {
      enabled: true, required: fields.area.required,
      options: fields.area.options?.split(",").map(s => s.trim()).filter(Boolean) ?? [],
    };
    if (fields.transport.enabled) fieldsConfig.transport = { enabled: true, required: fields.transport.required };
    if (fields.lodging.enabled)   fieldsConfig.lodging   = { enabled: true, required: fields.lodging.required };
    if (fields.meals.enabled)     fieldsConfig.meals     = { enabled: true, required: fields.meals.required };

    const pricingConfig: Record<string, any> = {};
    if (fields.transport.enabled) pricingConfig.transport = { price: parseFloat(prices.transport) || 0 };
    if (fields.lodging.enabled)   pricingConfig.lodging   = { price: parseFloat(prices.lodging)   || 0 };
    if (fields.meals.enabled)     pricingConfig.meals     = { price: parseFloat(prices.meals)     || 0 };

    const res = await fetch(`/api/activities/${data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description, location,
        date,
        dateEnd: multiDay ? dateEnd : null,
        basePrice: parseFloat(basePrice),
        fieldsConfig,
        pricingConfig,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      setError(errData.error ?? "Error al guardar cambios");
      setLoading(false);
      return;
    }

    router.push(`/admin/activities/${data.id}`);
    router.refresh();
  }

  const fieldLabels: Record<string, string> = {
    shirtSize: "Talla de Camisa",
    area:      "Área",
    transport: "Transporte",
    lodging:   "Hospedaje",
    meals:     "Alimentación",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Información de la Actividad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
          </div>

          {/* Fecha */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-3">
              <button type="button"
                onClick={() => { setMultiDay(false); setDateEnd(""); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${!multiDay ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
                style={!multiDay ? { background: "#2d1054" } : {}}>
                Un solo día
              </button>
              <button type="button"
                onClick={() => setMultiDay(true)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition ${multiDay ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
                style={multiDay ? { background: "#2d1054" } : {}}>
                Varios días
              </button>
            </div>
            {!multiDay ? (
              <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha inicial</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <span className="text-gray-400 text-sm mt-4">→</span>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha final</label>
                  <input type="date" required value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                    min={date}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lugar</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ciudad, lugar" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Participación (GTQ) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Q</span>
              <input type="number" required min={0} step={1} value={basePrice}
                onChange={e => setBasePrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Campos del formulario */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-1">Campos del Formulario</h3>
        <p className="text-gray-400 text-sm mb-4">Define qué información se recopilará</p>
        <div className="space-y-3">
          {Object.entries(fields).map(([name, config]) => (
            <div key={name} className={`border rounded-xl p-4 transition ${config.enabled ? "border-purple-200 bg-purple-50" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={config.enabled}
                  onChange={e => updateField(name, { enabled: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <label className="flex-1 font-medium text-sm text-gray-800">{fieldLabels[name]}</label>
                {config.enabled && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input type="checkbox" checked={config.required}
                      onChange={e => updateField(name, { required: e.target.checked })}
                      className="w-3.5 h-3.5 rounded" />
                    Obligatorio
                  </label>
                )}
              </div>

              {config.enabled && name === "area" && (
                <div className="mt-3 pl-7">
                  <input type="text" value={config.options ?? ""} onChange={e => updateField(name, { options: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Adoración, Jóvenes, Damas (separados por coma — vacío = texto libre)" />
                </div>
              )}

              {config.enabled && (name === "transport" || name === "lodging" || name === "meals") && (
                <div className="mt-3 pl-7 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Costo por persona:</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Q</span>
                    <input type="number" min={0}
                      value={prices[name as "transport" | "lodging" | "meals"]}
                      onChange={e => setPrices({ ...prices, [name]: e.target.value })}
                      className="w-28 pl-5 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
          style={{ background: "#2d1054" }}>
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
