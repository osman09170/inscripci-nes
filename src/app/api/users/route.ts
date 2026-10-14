import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "SECRETARY"]),
});

// GET /api/users - Listar usuarios (solo admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

// POST /api/users - Crear usuario (solo admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
  }

  const { password, ...userData } = parsed.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { ...userData, password: hashedPassword },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}