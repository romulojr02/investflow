import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const investor = await prisma.investor.findFirst({
    where: { id, rmId: session.user.id },
    include: {
      expenses: { include: { supplier: true }, orderBy: { date: "desc" } },
      monthlyFees: { orderBy: { year: "desc", month: "desc" } },
    },
  });

  if (!investor) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(investor);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.investor.deleteMany({ where: { id, rmId: session.user.id } });
  return NextResponse.json({ ok: true });
}
