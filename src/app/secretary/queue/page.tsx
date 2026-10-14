import { PendingQueue } from "@/components/secretary/PendingQueue";

export default function QueuePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cola de Inscripciones</h1>
        <p className="text-gray-500 mt-1">
          Formularios enviados desde tablets · Confirma y cobra a cada persona
        </p>
      </div>
      <PendingQueue />
    </div>
  );
}
