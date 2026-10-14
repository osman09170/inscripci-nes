import { type ClassValue, clsx } from "clsx";

// Simple className merger without clsx dependency
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

// Formatear moneda en Quetzales guatemaltecos (GTQ)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Formatear fecha en español
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// Formatear hora
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// Generar ticket único legible
export function generateTicket(activityTitle: string): string {
  const prefix = activityTitle.slice(0, 3).toUpperCase().replace(/\s/g, "");
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

// Calcular total de inscripción según servicios
export function calculateTotal(
  basePrice: number,
  selections: {
    transport?: { needed: boolean };
    lodging?: { needed: boolean };
    meals?: { needed: boolean };
  },
  pricing: {
    transport?: { price: number };
    lodging?: { [type: string]: number };
    meals?: { price?: number };
  }
): number {
  let total = basePrice;

  if (selections.transport?.needed && pricing.transport) {
    total += pricing.transport.price;
  }

  if (selections.lodging?.needed && pricing.lodging?.price) {
    total += pricing.lodging.price;
  }

  if (selections.meals?.needed && pricing.meals?.price) {
    total += pricing.meals.price;
  }

  return total;
}

// Mapas de labels
export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  SECRETARY: "Secretaria",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
};