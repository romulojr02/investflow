import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  document: z.string().optional(),
  notes: z.string().optional(),
  createLogin: z.boolean().optional(),
  loginPassword: z.string().min(6).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const investors = await prisma.investor.findMany({
    where: { rmId: session.user.id },
    include: {
      _count: { select: { expenses: true, monthlyFees: true } },
      expenses: { select: { amount: true, status: true } },
      monthlyFees: { select: { amount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(investors);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const investor = await prisma.investor.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        document: data.document || null,
        notes: data.notes || null,
        rmId: session.user.id,
      },
    });

    if (data.createLogin && data.email && data.loginPassword) {
      const bcrypt = await import("bcryptjs");
      const hashed = await bcrypt.hash(data.loginPassword, 12);
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashed,
          role: "INVESTOR",
        },
      });
      await prisma.investor.update({
        where: { id: investor.id },
        data: { userId: user.id },
      });
    }

    return NextResponse.json(investor, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: (err as z.ZodError).issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
