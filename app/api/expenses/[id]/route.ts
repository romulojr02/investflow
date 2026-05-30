import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const data = patchSchema.parse(body);

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.description && { description: data.description }),
      ...(data.amount && { amount: data.amount }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: { supplier: true, investor: { select: { id: true, name: true } } },
  });

  return NextResponse.json(expense);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
