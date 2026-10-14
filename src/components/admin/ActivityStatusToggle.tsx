"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  activityId: string;
  isActive: boolean;
}

export function ActivityStatusToggle({ activityId, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await fetch(`/api/activities/${activityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    setConfirm(false);
    router.refresh();
  }

  if (isActive) {
    return (
      <>
        <button
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition text-white"
          style={{ background: "#b45309" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Cerrar Actividad
        </button>

        {confirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(180,83,9,0.1)" }}>
                <svg className="w-7 h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Cerrar esta actividad?</h3>
              <p className="text-gray-500 text-sm mb-6">
                El formulario público dejará de estar disponible y no se podrán registrar nuevas inscripciones.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirm(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleToggle}
                  disabled={loading}
                  className="flex-1 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                  style={{ background: "#b45309" }}
                >
                  {loading ? "Cerrando..." : "Sí, cerrar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition text-white disabled:opacity-50"
      style={{ background: "#16a34a" }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {loading ? "Reactivando..." : "Reactivar Actividad"}
    </button>
  );
}
