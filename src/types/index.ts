// =========================================
// TIPOS CENTRALES DEL SISTEMA
// =========================================

export type UserRole = "ADMIN" | "SECRETARY";
export type PaymentMethod = "CASH" | "TRANSFER" | "CARD";
export type RegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type ShiftStatus = "OPEN" | "CLOSED";

// --------- USUARIO ---------
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

// --------- ACTIVIDAD ---------
export interface Activity {
  id: string;
  title: string;
  description?: string;
  date: Date;
  location?: string;
  basePrice: number;
  isActive: boolean;
  formConfig?: FormConfig;
  _count?: { registrations: number };
}

// --------- CONFIGURACIÓN DE FORMULARIO ---------
export interface FieldConfig {
  enabled: boolean;
  required: boolean;
  options?: string[];      // Para selects
  routes?: string[];       // Para transporte
  types?: string[];        // Para hospedaje
}

export interface FormFieldsConfig {
  shirtSize?: FieldConfig;
  area?: FieldConfig;
  transport?: FieldConfig;
  lodging?: FieldConfig;
  meals?: FieldConfig;
}

export interface PricingConfig {
  transport?: { price: number };
  lodging?: { price?: number };
  meals?: { price?: number };
}

export interface FormConfig {
  id: string;
  activityId: string;
  fieldsConfig: FormFieldsConfig;
  pricingConfig: PricingConfig;
}

// --------- INSCRIPCIÓN ---------
export interface TransportData {
  needed: boolean;
  route?: string;
}

export interface LodgingData {
  needed: boolean;
}

export interface MealsData {
  needed: boolean;
}

export interface Registration {
  id: string;
  ticket: string;
  activityId: string;
  activity?: Activity;
  createdById: string;
  createdBy?: User;
  fullName: string;
  age: number;
  shirtSize?: string;
  area?: string;
  transport?: TransportData;
  lodging?: LodgingData;
  meals?: MealsData;
  totalAmount: number;
  notes?: string;
  status: RegistrationStatus;
  payment?: Payment;
  createdAt: Date;
}

// Datos del formulario de inscripción (para el form de secretaria)
export interface RegistrationFormData {
  activityId: string;
  fullName: string;
  age: number;
  shirtSize?: string;
  area?: string;
  transport?: TransportData;
  lodging?: LodgingData;
  meals?: MealsData;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
}

// --------- PAGO ---------
export interface Payment {
  id: string;
  registrationId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  cashShiftId?: string;
  confirmedAt: Date;
}

// --------- TURNO DE CAJA ---------
export interface CashShift {
  id: string;
  userId: string;
  user?: User;
  status: ShiftStatus;
  openingAmount: number;
  openedAt: Date;
  closingCashAmount?: number;
  closingTransferAmount?: number;
  expectedAmount?: number;
  difference?: number;
  closingNotes?: string;
  closedAt?: Date;
  payments?: Payment[];
  // Calculados
  totalCash?: number;
  totalTransfer?: number;
  totalCard?: number;
  totalCollected?: number;
}

// --------- DASHBOARD / MÉTRICAS ---------
export interface DashboardStats {
  totalRevenue: number;
  totalRegistrations: number;
  activeActivities: number;
  openShifts: number;
  revenueByActivity: { name: string; total: number; count: number }[];
  revenueBySecretary: { name: string; total: number }[];
  recentRegistrations: Registration[];
}

export interface ShiftSummary {
  totalCash: number;
  totalTransfer: number;
  totalCard: number;
  total: number;
  count: number;
}