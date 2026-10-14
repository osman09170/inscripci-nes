import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SecretaryCashBar } from "@/components/secretary/CashBar";

export default async function SecretaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "SECRETARY") redirect("/admin/dashboard");

  // Verificar turno activo
  const openShift = await prisma.cashShift.findFirst({
    where: { userId: session.user.id, status: "OPEN" },
    include: { payments: true },
  });

  const totalTurno = openShift?.payments.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const countTurno = openShift?.payments.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SecretaryCashBar
        userName={session.user.name ?? ""}
        shiftOpen={!!openShift}
        shiftId={openShift?.id}
        totalCollected={totalTurno}
        transactionCount={countTurno}
        openedAt={openShift?.openedAt?.toISOString()}
      />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}