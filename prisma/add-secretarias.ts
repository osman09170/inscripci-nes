import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const secretarias = [
  { name: "Suzely Mendez",       email: "suzely.mendez@palabramiel.com",       pass: "suzely2024"     },
  { name: "Amanda Xiquin",       email: "amanda.xiquin@palabramiel.com",       pass: "amanda2024"     },
  { name: "Arelis Secretaria",   email: "arelis.secretaria@palabramiel.com",   pass: "arelis2024"     },
  { name: "Cefora Ramirez",      email: "cefora.ramirez@palabramiel.com",      pass: "cefora2024"     },
  { name: "Cristhal Morales",    email: "cristhal.morales@palabramiel.com",    pass: "cristhal2024"   },
  { name: "Evelyn Estrada",      email: "evelyn.estrada@palabramiel.com",      pass: "evelyn2024"     },
  { name: "Fernanda Leonardo",   email: "fernanda.leonardo@palabramiel.com",   pass: "fernanda2024"   },
  { name: "Gaby Rac",            email: "gaby.rac@palabramiel.com",            pass: "gaby2024"       },
  { name: "Ines Reyes",          email: "ines.reyes@palabramiel.com",          pass: "ines2024"       },
  { name: "Karen Ventura",       email: "karen.ventura@palabramiel.com",       pass: "karenV2024"     },
  { name: "Berenice Barrera",    email: "berenice.barrera@palabramiel.com",    pass: "berenice2024"   },
  { name: "Maritza Lopez",       email: "maritza.lopez@palabramiel.com",       pass: "maritza2024"    },
  { name: "Mishell Solval",      email: "mishell.solval@palabramiel.com",      pass: "mishell2024"    },
  { name: "Perla Morales",       email: "perla.morales@palabramiel.com",       pass: "perla2024"      },
  { name: "Nohemi Guarcas",      email: "nohemi.guarcas@palabramiel.com",      pass: "nohemi2024"     },
  { name: "Pahola Tiney",        email: "pahola.tiney@palabramiel.com",        pass: "pahola2024"     },
  { name: "Sofia Donis",         email: "sofia.donis@palabramiel.com",         pass: "sofiaD2024"     },
  { name: "Katherine Barrera",   email: "katherine.barrera@palabramiel.com",   pass: "katherine2024"  },
  { name: "Sofia Salguero",      email: "sofia.salguero@palabramiel.com",      pass: "sofiaS2024"     },
  { name: "Susan de Lemus",      email: "susan.delemus@palabramiel.com",       pass: "susan2024"      },
  { name: "Yessika de Leon",     email: "yessika.deleon@palabramiel.com",      pass: "yessika2024"    },
  { name: "Karen Ixpec",         email: "karen.ixpec@palabramiel.com",         pass: "karenI2024"     },
];

async function main() {
  console.log("👥 Agregando 22 secretarias...\n");

  for (const s of secretarias) {
    const hashed = await bcrypt.hash(s.pass, 12);
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name:     s.name,
        email:    s.email,
        password: hashed,
        role:     "SECRETARY",
      },
    });
    console.log(`✅  ${s.name.padEnd(22)}  ${s.email.padEnd(40)}  contraseña: ${s.pass}`);
  }

  console.log("\n✔ Todas las secretarias fueron creadas.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
