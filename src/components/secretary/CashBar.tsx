"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { CashOpenModal } from "./CashOpenModal";
import { CashCloseModal } from "./CashCloseModal";

interface CashBarProps {
  userName: string;
  shiftOpen: boolean;
  shiftId?: string;
  totalCollected: number;
  transactionCount: number;
  openedAt?: string;
}

export function SecretaryCashBar({
  userName,
  shiftOpen,
  shiftId,
  totalCollected,
  transactionCount,
  openedAt,
}: CashBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showOpenModal, setShowOpenModal] = useState(!shiftOpen);
  const [showCloseModal, setShowCloseModal] = useState(false);

  async function handleSignOut() {
    if (shiftOpen) {
      alert("⚠️ Debes cerrar tu caja (cuadre de turno) antes de salir del sistema.");
      return;
    }
    await signOut({ callbackUrl: "/login" });
  }

  const navLinks = [
    {
      href: "/secretary/queue",
      label: "Cola de formularios",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    },
    {
      href: "/secretary/register",
      label: "Nueva manual",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    },
    {
      href: "/secretary/registrations",
      label: "Inscritos",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 z-20 px-6 flex items-center justify-between"
        style={{ background: "#1a0a2e", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        {/* Logo + Nav */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#c9a84c" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: "#1a0a2e" }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm">Inscripciones</span>
          </div>

          <span style={{ color: "rgba(201,168,76,0.3)" }}>|</span>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{userName}</span>
          <span style={{ color: "rgba(201,168,76,0.3)" }}>|</span>

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-1.5 text-sm font-medium transition"
                style={{ color: isActive ? "#c9a84c" : "rgba(255,255,255,0.5)" }}>
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Estado de Caja */}
        <div className="flex items-center gap-4">
          {shiftOpen ? (
            <>
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-green-400">Caja Abierta</span>
              </div>
              <div className="text-sm">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Turno: </span>
                <span className="font-bold text-white">{formatCurrency(totalCollected)}</span>
                <span className="ml-1 text-xs" style={{ color: "rgba(201,168,76,0.6)" }}>({transactionCount} pagos)</span>
              </div>
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                style={{ background: "#b45309" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cerrar Caja
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-medium text-red-400">Caja Cerrada</span>
            </div>
          )}

          <button
            onClick={handleSignOut}
            title={shiftOpen ? "Cierra tu caja antes de salir" : "Cerrar sesión"}
            className="p-1.5 rounded-lg transition"
            style={{ color: shiftOpen ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="fixed top-16 left-0 right-0 h-0 z-10" />

      {showOpenModal && (
        <CashOpenModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={() => {
            setShowOpenModal(false);
            router.refresh();
          }}
        />
      )}
      {showCloseModal && shiftId && (
        <CashCloseModal
          shiftId={shiftId}
          totalCollected={totalCollected}
          onClose={() => setShowCloseModal(false)}
          onSuccess={() => {
            setShowCloseModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
