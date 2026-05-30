import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(2),
  amount: z.number().positive(),
  date: z.string(),
  investorId: z.string(),
  supplierId: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).default("PENDING"),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const investorId = searchParams.get("investorId");

  if (session.user.role === "INVESTOR") {
    const investor = await prisma.investor.findFirst({
      where: { userId: session.user.id },
    });
    if (!investor) return NextResponse.json([]);

    const expenses = await prisma.expense.findMany({
      where: { investorId: investor.id },
      include: { supplier: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  }

  const expenses = await prisma.expense.findMany({
    where: {
      investor: { rmId: session.user.id },
      ...(investorId ? { investorId } : {}),
    },
    include: { supplier: true, investor: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const investor = await prisma.investor.findFirst({
      where: { id: data.investorId, rmId: session.user.id },
    });
    if (!investor) return NextResponse.json({ error: "Investidor não encontrado" }, { status: 404 });

    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        investorId: data.investorId,
        supplierId: data.supplierId || null,
        category: data.category || null,
        notes: data.notes || null,
        status: data.status,
      },
      include: { supplier: true, investor: { select: { id: true, name: true } } },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: (err as z.ZodError).issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
