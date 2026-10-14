import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Todos los usuarios con sus nuevas contraseñas (2024 → 2026)
const usuarios = [
  // Admins
  { email: "osman.lemus@palabramiel.com",           pass: "osman2026"     },
  { email: "carlos.juares@palabramiel.com",          pass: "carlos2026"    },
  { email: "juanjo.estrada@palabramiel.com",         pass: "juanjo2026"    },
  { email: "jose.cornejo@palabramiel.com",           pass: "jose2026"      },
  // Secretarias
  { email: "suzely.mendez@palabramiel.com",          pass: "suzely2026"    },
  { email: "amanda.xiquin@palabramiel.com",          pass: "amanda2026"    },
  { email: "arelis.secretaria@palabramiel.com",      pass: "arelis2026"    },
  { email: "cefora.ramirez@palabramiel.com",         pass: "cefora2026"    },
  { email: "cristhal.morales@palabramiel.com",       pass: "cristhal2026"  },
  { email: "evelyn.estrada@palabramiel.com",         pass: "evelyn2026"    },
  { email: "fernanda.leonardo@palabramiel.com",      pass: "fernanda2026"  },
  { email: "gaby.rac@palabramiel.com",               pass: "gaby2026"      },
  { email: "ines.reyes@palabramiel.com",             pass: "ines2026"      },
  { email: "karen.ventura@palabramiel.com",          pass: "karenV2026"    },
  { email: "berenice.barrera@palabramiel.com",       pass: "berenice2026"  },
  { email: "maritza.lopez@palabramiel.com",          pass: "maritza2026"   },
  { email: "mishell.solval@palabramiel.com",         pass: "mishell2026"   },
  { email: "perla.morales@palabramiel.com",          pass: "perla2026"     },
  { email: "nohemi.guarcas@palabramiel.com",         pass: "nohemi2026"    },
  { email: "pahola.tiney@palabramiel.com",           pass: "pahola2026"    },
  { email: "sofia.donis@palabramiel.com",            pass: "sofiaD2026"    },
  { email: "katherine.barrera@palabramiel.com",      pass: "katherine2026" },
  { email: "sofia.salguero@palabramiel.com",         pass: "sofiaS2026"    },
  { email: "susan.delemus@palabramiel.com",          pass: "susan2026"     },
  { email: "yessika.deleon@palabramiel.com",         pass: "yessika2026"   },
  { email: "karen.ixpec@palabramiel.com",            pass: "karenI2026"    },
];

async function main() {
  console.log("🔑 Actualizando contraseñas 2024 → 2026...\n");

  for (const u of usuarios) {
    const hashed = await bcrypt.hash(u.pass, 12);
    await prisma.user.update({
      where: { email: u.email },
      data: { password: hashed },
    });
    console.log(`✅  ${u.email.padEnd(45)}  nueva contraseña: ${u.pass}`);
  }

  console.log(`\n✔ ${usuarios.length} contraseñas actualizadas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
