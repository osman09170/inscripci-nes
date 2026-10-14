"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, calculateTotal, SHIRT_SIZES } from "@/lib/utils";
import type { Activity, FormFieldsConfig, PricingConfig } from "@/types";

interface RegistrationFormProps {
  activities: (Activity & {
    formConfig: {
      fieldsConfig: FormFieldsConfig;
      pricingConfig: PricingConfig;
    } | null;
  })[];
}

export function RegistrationForm({ activities }: RegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<null | { ticket: string; total: number; name: string }>(null);
  const [error, setError] = useState("");

  const [selectedActivityId, setSelectedActivityId] = useState(activities[0]?.id ?? "");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [area, setArea] = useState("");
  const [wantsTransport, setWantsTransport] = useState(false);
  const [transportRoute, setTransportRoute] = useState("");
  const [lodging, setLodging] = useState({ needed: false });
  const [meals, setMeals] = useState({ needed: false });
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "CARD">("CASH");
  const [paymentReference, setPaymentReference] = useState("");

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);
  const fieldsConfig = selectedActivity?.formConfig?.fieldsConfig ?? {};
  const pricingConfig = selectedActivity?.formConfig?.pricingConfig ?? {};

  const totalAmount = selectedActivity
    ? calculateTotal(Number(selectedActivity.basePrice), { transport: { needed: wantsTransport }, lodging, meals }, pricingConfig)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId: selectedActivityId,
        fullName,
        age: parseInt(age),
        shirtSize: shirtSize || undefined,
        area: area || undefined,
        wantsTransport,
        transportRoute: wantsTransport && transportRoute ? transportRoute : undefined,
        lodging: fieldsConfig.lodging?.enabled ? lodging : undefined,
        meals: fieldsConfig.meals?.enabled ? meals : undefined,
        totalAmount,
        paymentMethod,
        paymentReference: paymentReference || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al registrar inscripción");
      setLoading(false);
      return;
    }

    setSuccess({
      ticket: data.ticket,
      total: Number(data.totalAmount),
      name: data.fullName,
    });
    setLoading(false);
  }

  function handleNewRegistration() {
    setSuccess(null);
    setFullName("");
    setAge("");
    setShirtSize("");
    setArea("");
    setWantsTransport(false);
    setTransportRoute("");
    setLodging({ needed: false });
    setMeals({ needed: false });
    setPaymentMethod("CASH");
    setPaymentReference("");
  }

  // Comprobante exitoso
  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Inscripción Confirmada</h2>
        <p className="text-gray-500 mb-6">{success.name}</p>

        <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-dashed border-gray-300">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Número de Ticket</p>
          <p className="text-3xl font-mono font-bold text-blue-700 tracking-wider">
            {success.ticket}
          </p>
          <div className="border-t border-gray-200 mt-4 pt-4">
            <p className="text-sm text-gray-500">Total cobrado</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(success.total)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
          <button
            onClick={handleNewRegistration}
            className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition"
          >
            Nueva Inscripción
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Selección de Actividad */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
          Actividad
        </h3>
        {activities.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay actividades disponibles</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activities.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => setSelectedActivityId(act.id)}
                className={`text-left p-3 rounded-xl border-2 transition ${
                  selectedActivityId === act.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-sm text-gray-900">{act.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(act.date).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}
                </p>
                <p className="text-sm font-bold text-green-700 mt-1">
                  {formatCurrency(Number(act.basePrice))}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Datos del Inscrito */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
          Datos del Asistente
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre y apellidos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Edad <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Años"
            />
          </div>

          {(fieldsConfig.shirtSize?.enabled ?? true) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Talla de Camisa{" "}
                {fieldsConfig.shirtSize?.required && <span className="text-red-500">*</span>}
              </label>
              <select
                value={shirtSize}
                onChange={(e) => setShirtSize(e.target.value)}
                required={fieldsConfig.shirtSize?.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona...</option>
                {SHIRT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {(fieldsConfig.area?.enabled ?? false) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Área{" "}
                {fieldsConfig.area?.required && <span className="text-red-500">*</span>}
              </label>
              {fieldsConfig.area?.options?.length ? (
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required={fieldsConfig.area?.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona área...</option>
                  {fieldsConfig.area.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required={fieldsConfig.area?.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Área o ministerio"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Transporte (siempre visible) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
          Transporte
        </h3>
        <div className="border border-gray-200 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wantsTransport}
              onChange={(e) => setWantsTransport(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Necesita transporte
                {pricingConfig.transport && (
                  <span className="ml-2 text-green-700">
                    +{formatCurrency(pricingConfig.transport.price)}
                  </span>
                )}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Servicios Adicionales */}
      {(fieldsConfig.lodging?.enabled || fieldsConfig.meals?.enabled) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">4</span>
            Servicios Adicionales
          </h3>
          <div className="space-y-4">

            {/* Hospedaje */}
            {fieldsConfig.lodging?.enabled && (
              <div className="border border-gray-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lodging.needed}
                    onChange={(e) => setLodging({ needed: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Deseo hospedaje</p>
                    {pricingConfig.lodging?.price ? (
                      <p className="text-xs text-green-700">+{formatCurrency(pricingConfig.lodging.price)}</p>
                    ) : null}
                  </div>
                </label>
              </div>
            )}

            {/* Alimentación */}
            {fieldsConfig.meals?.enabled && (
              <div className="border border-gray-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meals.needed}
                    onChange={(e) => setMeals({ needed: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Deseo alimentación</p>
                    {pricingConfig.meals?.price ? (
                      <p className="text-xs text-green-700">+{formatCurrency(pricingConfig.meals.price)}</p>
                    ) : null}
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Pago */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">5</span>
          Método de Pago
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {(["CASH", "TRANSFER", "CARD"] as const).map((method) => {
            const labels = { CASH: "Efectivo", TRANSFER: "Transferencia", CARD: "Tarjeta" };
            const icons = {
              CASH: "💵",
              TRANSFER: "📱",
              CARD: "💳",
            };
            return (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition text-sm font-medium ${
                  paymentMethod === method
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="text-xl">{icons[method]}</span>
                {labels[method]}
              </button>
            );
          })}
        </div>

        {paymentMethod === "TRANSFER" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Número de Referencia
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: TXN-123456"
            />
          </div>
        )}
      </div>

      {/* Total y Confirmar */}
      <div className="bg-blue-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm">Total a Cobrar</p>
            <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="text-right text-sm text-blue-200">
            <p>Base: {formatCurrency(Number(selectedActivity?.basePrice ?? 0))}</p>
            {totalAmount !== Number(selectedActivity?.basePrice ?? 0) && (
              <p>Servicios: +{formatCurrency(totalAmount - Number(selectedActivity?.basePrice ?? 0))}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 rounded-lg p-3 text-sm text-white mb-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedActivityId || !fullName || !age}
          className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 disabled:opacity-50 transition text-sm"
        >
          {loading ? "Procesando..." : `Confirmar Inscripción · ${formatCurrency(totalAmount)}`}
        </button>
      </div>
    </form>
  );
}