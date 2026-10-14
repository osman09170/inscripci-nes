import { ActivityForm } from "@/components/admin/ActivityForm";

export default function NewActivityPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Actividad</h1>
        <p className="text-gray-500 mt-1">Crea un nuevo evento o actividad de la iglesia</p>
      </div>
      <ActivityForm />
    </div>
  );
}