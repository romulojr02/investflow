import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExpensesClient } from "@/components/rm/expenses-client";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session) return null;

  const [expenses, investors, suppliers] = await Promise.all([
    prisma.expense.findMany({
      where: { investor: { rmId: session.user.id } },
      include: {
        supplier: true,
        investor: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.investor.findMany({
      where: { rmId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const serialized = expenses.map((e) => ({
    ...e,
    amount: Number(e.amount),
    supplier: e.supplier ? { id: e.supplier.id, name: e.supplier.name } : null,
  }));

  return <ExpensesClient expenses={serialized} investors={investors} suppliers={suppliers} />;
}
