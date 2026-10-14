import { RegistrationsList } from "@/components/secretary/RegistrationsList";

export default function RegistrationsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inscritos</h1>
        <p className="text-gray-500 mt-1">
          Fichas confirmadas · Verde = pagado · Amarillo = con abono · Gris = sin pagar
        </p>
      </div>
      <RegistrationsList />
    </div>
  );
}
