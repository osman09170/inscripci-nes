"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Credenciales incorrectas. Por favor verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a0a2e] via-[#2d1054] to-[#1a0a2e]">

      {/* Detalles decorativos dorados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#c9a84c]/5 blur-2xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-[#c9a84c]/5 blur-3xl" />
      </div>

      {/* Logo / Header */}
      <div className="mb-8 text-center relative">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg ring-2 ring-[#c9a84c]/50">
          <Image
            src="/logo.png"
            alt="Juventud Palabra Miel"
            width={96}
            height={96}
            className="object-cover w-full h-full"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-white">Juventud Palabra Miel</h1>
        <p className="text-[#c9a84c] text-sm mt-1 tracking-widest uppercase">Inscripciones</p>
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-md rounded-2xl shadow-2xl p-8 relative"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
          border: "1px solid rgba(201,168,76,0.25)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Línea dorada superior */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent" />

        <h2 className="text-xl font-semibold text-white mb-1">Iniciar Sesión</h2>
        <p className="text-purple-300/70 text-sm mb-6">
          Ingresa tus credenciales para acceder al sistema
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#c9a84c]/90 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm transition text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(201,168,76,0.2)",
              }}
              placeholder="usuario@palabramiel.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#c9a84c]/90 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm transition text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(201,168,76,0.2)",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 font-semibold rounded-lg transition text-sm disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #e8cc7a 50%, #c9a84c 100%)",
              color: "#1a0a2e",
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Línea dorada inferior */}
        <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent" />
      </div>

      <p className="mt-6 text-[#c9a84c]/40 text-xs">
        © Powered by LDT
      </p>
    </div>
  );
}
