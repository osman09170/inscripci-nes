import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inscripciones - Iglesia Palabra Miel",
  description: "Sistema de gestión de inscripciones y control de caja",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-[var(--font-geist-sans)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}