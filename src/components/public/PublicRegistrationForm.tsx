"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateTotal, formatCurrency, SHIRT_SIZES } from "@/lib/utils";
import type { Activity, FormFieldsConfig, PricingConfig } from "@/types";

interface Props {
  activity: Activity & {
    basePrice: number;
    formConfig: { fieldsConfig: FormFieldsConfig; pricingConfig: PricingConfig } | null;
  };
}

// Componente de sección con número de paso
function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", color: "#c9a84c" }}>
        {n}
      </div>
      <h3 className="text-white font-semibold">{label}</h3>
    </div>
  );
}

// Input con estilo morado/dorado
function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl text-white text-base transition focus:outline-none"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(201,168,76,0.2)",
        ...(props.style ?? {}),
      }}
    />
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-4 py-3 rounded-xl text-white text-base bg-transparent focus:outline-none appearance-none"
      style={{
        background: "rgba(30,10,60,0.8)",
        border: "1px solid rgba(201,168,76,0.2)",
      }}
    />
  );
}

export function PublicRegistrationForm({ activity }: Props) {
  const router = useRouter();
  const fieldsConfig = activity.formConfig?.fieldsConfig ?? {};
  const pricingConfig = activity.formConfig?.pricingConfig ?? {};

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<null | { ticket: string }>(null);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [area, setArea] = useState("");
  const [wantsTransport, setWantsTransport] = useState(false);
  const [transportRoute, setTransportRoute] = useState("");
  const [lodging, setLodging] = useState({ needed: false });
  const [meals, setMeals] = useState({ needed: false });
  const [notes, setNotes] = useState("");

  const lodgingStep = fieldsConfig.lodging?.enabled ? 3 : null;
  const mealsStep = fieldsConfig.meals?.enabled
    ? (fieldsConfig.lodging?.enabled ? 4 : 3)
    : null;
  const notesStep = 3
    + (fieldsConfig.lodging?.enabled ? 1 : 0)
    + (fieldsConfig.meals?.enabled ? 1 : 0);

  const totalAmount = calculateTotal(
    activity.basePrice,
    { transport: { needed: wantsTransport }, lodging, meals },
    pricingConfig
  );

  async function handleSubmit() {
    if (!fullName || !age) { setError("Nombre y edad son obligatorios"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/public/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activityId: activity.id,
        fullName,
        age: parseInt(age),
        shirtSize: shirtSize || undefined,
        area: area || undefined,
        wantsTransport,
        transportRoute: wantsTransport && transportRoute ? transportRoute : undefined,
        lodging: fieldsConfig.lodging?.enabled ? lodging : undefined,
        meals: fieldsConfig.meals?.enabled ? meals : undefined,
        notes: notes || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al enviar. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    setSuccess({ ticket: data.ticket });
    setLoading(false);
  }

  // Pantalla de éxito
  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(201,168,76,0.15)", border: "2px solid rgba(201,168,76,0.5)" }}>
          <svg className="w-10 h-10 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">¡Formulario enviado!</h2>
        <p className="text-purple-300/70 mb-8">
          Acércate a una secretaria con tu número de turno para completar tu inscripción y realizar el pago.
        </p>

        <div className="rounded-2xl p-8 mb-8"
          style={{ background: "rgba(201,168,76,0.08)", border: "2px dashed rgba(201,168,76,0.3)" }}>
          <p className="text-purple-300/60 text-sm uppercase tracking-widest mb-3">Tu número de turno</p>
          <p className="text-4xl font-mono font-bold text-[#c9a84c] tracking-wider break-all">
            {success.ticket}
          </p>
          <p className="text-purple-300/50 text-sm mt-4">
            La secretaria buscará este número para atenderte
          </p>
        </div>

        <button
          onClick={() => router.push("/form")}
          className="w-full py-4 rounded-xl font-bold text-lg transition active:scale-95"
          style={{ background: "linear-gradient(135deg, #c9a84c, #e8cc7a)", color: "#1a0a2e" }}
        >
          Nueva inscripción
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* PASO 1 — Datos personales */}
      <div className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
        <Step n={1} label="Tus datos" />
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#c9a84c]/80 mb-2">
              Nombre completo <span className="text-red-400">*</span>
            </label>
            <StyledInput
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Escribe tu nombre y apellido"
            />
          </div>

          <div>
            <label className="block text-sm text-[#c9a84c]/80 mb-2">
              Edad <span className="text-red-400">*</span>
            </label>
            <StyledInput
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Tu edad en años"
            />
          </div>

          {(fieldsConfig.shirtSize?.enabled ?? true) && (
            <div>
              <label className="block text-sm text-[#c9a84c]/80 mb-2">
                Talla de camisa
                {fieldsConfig.shirtSize?.required && <span className="text-red-400"> *</span>}
              </label>
              <StyledSelect
                value={shirtSize}
                onChange={(e) => setShirtSize(e.target.value)}
                required={fieldsConfig.shirtSize?.required}
              >
                <option value="">Selecciona tu talla...</option>
                {SHIRT_SIZES.map((s) => (
                  <option key={s} value={s} style={{ background: "#2d1054" }}>{s}</option>
                ))}
              </StyledSelect>
            </div>
          )}

          {fieldsConfig.area?.enabled && (
            <div>
              <label className="block text-sm text-[#c9a84c]/80 mb-2">
                Área
                {fieldsConfig.area.required && <span className="text-red-400"> *</span>}
              </label>
              {fieldsConfig.area.options?.length ? (
                <StyledSelect
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required={fieldsConfig.area.required}
                >
                  <option value="">Selecciona tu área...</option>
                  {fieldsConfig.area.options.map((opt: string) => (
                    <option key={opt} value={opt} style={{ background: "#2d1054" }}>{opt}</option>
                  ))}
                </StyledSelect>
              ) : (
                <StyledInput
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej: Adoración, Jóvenes..."
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* PASO 2 — Transporte (siempre visible) */}
      <div className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
        <Step n={2} label="Transporte" />
        <div className="rounded-xl p-4"
          style={{ background: wantsTransport ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${wantsTransport ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)"}` }}>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setWantsTransport(!wantsTransport)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition"
              style={{ background: wantsTransport ? "#c9a84c" : "rgba(255,255,255,0.1)", border: "1px solid rgba(201,168,76,0.4)" }}>
              {wantsTransport && (
                <svg className="w-4 h-4 text-[#1a0a2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-white font-medium">Necesito transporte</p>
              {pricingConfig.transport && (
                <p className="text-[#c9a84c] text-sm">+{formatCurrency(pricingConfig.transport.price)}</p>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* PASO 3 — Hospedaje (si está habilitado) */}
      {fieldsConfig.lodging?.enabled && (
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
          <Step n={lodgingStep!} label="Hospedaje" />
          <div className="rounded-xl p-4"
            style={{ background: lodging.needed ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${lodging.needed ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)"}` }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setLodging({ needed: !lodging.needed })}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                style={{ background: lodging.needed ? "#c9a84c" : "rgba(255,255,255,0.1)", border: "1px solid rgba(201,168,76,0.4)" }}>
                {lodging.needed && (
                  <svg className="w-4 h-4 text-[#1a0a2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-white font-medium">Deseo hospedaje</p>
                {pricingConfig.lodging?.price ? (
                  <p className="text-[#c9a84c] text-sm">+{formatCurrency(pricingConfig.lodging.price)}</p>
                ) : null}
              </div>
            </label>
          </div>
        </div>
      )}

      {/* PASO 4 — Alimentación (si está habilitada) */}
      {fieldsConfig.meals?.enabled && (
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
          <Step n={mealsStep!} label="Alimentación" />
          <div className="rounded-xl p-4"
            style={{ background: meals.needed ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${meals.needed ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)"}` }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setMeals({ needed: !meals.needed })}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                style={{ background: meals.needed ? "#c9a84c" : "rgba(255,255,255,0.1)", border: "1px solid rgba(201,168,76,0.4)" }}>
                {meals.needed && (
                  <svg className="w-4 h-4 text-[#1a0a2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-white font-medium">Deseo alimentación</p>
                {pricingConfig.meals?.price && (
                  <p className="text-[#c9a84c] text-sm">+{formatCurrency(pricingConfig.meals.price)}</p>
                )}
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Notas */}
      <div className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
        <Step n={notesStep} label="Observaciones (opcional)" />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-white text-sm resize-none focus:outline-none"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}
          placeholder="¿Alguna observación o requerimiento especial?"
        />
      </div>

      {/* Resumen y botón enviar */}
      <div className="rounded-2xl p-5"
        style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-purple-300/70 text-sm">Total estimado</p>
          <p className="text-3xl font-bold text-[#c9a84c]">{formatCurrency(totalAmount)}</p>
        </div>
        <p className="text-purple-300/50 text-xs mb-5">
          * El pago se realiza con la secretaria. Ella confirmará el monto final.
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-3 text-sm text-red-300 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !fullName || !age}
          className="w-full py-4 rounded-xl font-bold text-lg transition active:scale-95 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #c9a84c, #e8cc7a)", color: "#1a0a2e" }}
        >
          {loading ? "Enviando..." : "Enviar formulario"}
        </button>
      </div>
    </div>
  );
}
