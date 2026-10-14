import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Crear usuarios admin (5)
  const admins = [
    { name: "Pastor Carlos Mendoza", email: "carlos@palabramiel.com" },
    { name: "Coordinador Juan Pérez", email: "juan@palabramiel.com" },
    { name: "Directora Ana García", email: "ana@palabramiel.com" },
    { name: "Supervisor Pedro Ruiz", email: "pedro@palabramiel.com" },
    { name: "Admin María Torres", email: "maria@palabramiel.com" },
  ];

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        ...admin,
        password: await bcrypt.hash("admin123", 12),
        role: "ADMIN",
      },
    });
  }

  // Crear secretarias (15)
  const secretaries = [
    "Laura Martínez",
    "Sandra López",
    "Diana Vargas",
    "Carolina Ríos",
    "Valentina Cruz",
    "Natalia Herrera",
    "Paola Jiménez",
    "Claudia Romero",
    "Andrea Morales",
    "Daniela Castillo",
    "Stefany Díaz",
    "Tatiana Rojas",
    "Juliana Reyes",
    "Manuela Ortiz",
    "Isabella Gómez",
  ];

  for (let i = 0; i < secretaries.length; i++) {
    const name = secretaries[i];
    const email = `secretaria${i + 1}@palabramiel.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password: await bcrypt.hash("secretaria123", 12),
        role: "SECRETARY",
      },
    });
  }

  // Crear actividad de ejemplo
  const activity = await prisma.activity.upsert({
    where: { id: "actividad-campamento-2024" },
    update: {},
    create: {
      id: "actividad-campamento-2024",
      title: "Campamento Anual 2024",
      description: "Campamento espiritual anual para toda la familia de la iglesia.",
      date: new Date("2024-11-15"),
      location: "Finca El Remanso, Cundinamarca",
      basePrice: 150000,
      formConfig: {
        create: {
          fieldsConfig: JSON.stringify({
            shirtSize: { enabled: true, required: true },
            area: {
              enabled: true,
              required: false,
              options: ["Adoración", "Jóvenes", "Damas", "Caballeros", "Niños", "Matrimonios"],
            },
            transport: {
              enabled: true,
              required: false,
              routes: ["Ruta Norte", "Ruta Sur", "Ruta Centro"],
            },
            lodging: {
              enabled: true,
              required: false,
              types: ["Cabaña compartida", "Carpa", "Sin hospedaje"],
            },
            meals: { enabled: true, required: false },
          }),
          pricingConfig: JSON.stringify({
            transport: { price: 30000 },
            lodging: { "Cabaña compartida": 50000, Carpa: 20000, "Sin hospedaje": 0 },
            meals: { breakfast: 10000, lunch: 15000, dinner: 12000 },
          }),
        },
      },
    },
  });

  // Segunda actividad sin servicios adicionales
  await prisma.activity.upsert({
    where: { id: "actividad-retiro-mujeres" },
    update: {},
    create: {
      id: "actividad-retiro-mujeres",
      title: "Retiro de Mujeres",
      description: "Encuentro espiritual para el ministerio de damas.",
      date: new Date("2024-12-07"),
      location: "Centro de Convenciones Bethel",
      basePrice: 80000,
      formConfig: {
        create: {
          fieldsConfig: JSON.stringify({
            shirtSize: { enabled: true, required: false },
            area: { enabled: false, required: false },
            transport: { enabled: false, required: false },
            lodging: { enabled: false, required: false },
            meals: { enabled: true, required: false },
          }),
          pricingConfig: JSON.stringify({
            meals: { breakfast: 8000, lunch: 12000, dinner: 0 },
          }),
        },
      },
    },
  });

  console.log("✅ Seed completado exitosamente!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("  Admin: carlos@palabramiel.com / admin123");
  console.log("  Secretaria: secretaria1@palabramiel.com / secretaria123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());