import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const admins = [
  { name: "Osman Lemus",    email: "osman.lemus@palabramiel.com",   pass: "osman2024"   },
  { name: "Carlos Juares",  email: "carlos.juares@palabramiel.com", pass: "carlos2024"  },
  { name: "Juanjo Estrada", email: "juanjo.estrada@palabramiel.com",pass: "juanjo2024"  },
  { name: "Jose Cornejo",   email: "jose.cornejo@palabramiel.com",  pass: "jose2024"    },
];

async function main() {
  console.log("👤 Agregando 4 administradores...\n");

  for (const a of admins) {
    const hashed = await bcrypt.hash(a.pass, 12);
    await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        name:     a.name,
        email:    a.email,
        password: hashed,
        role:     "ADMIN",
      },
    });
    console.log(`✅  ${a.name.padEnd(18)}  ${a.email.padEnd(38)}  contraseña: ${a.pass}`);
  }

  console.log("\n✔ Administradores creados exitosamente.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
