import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [investors, expenses, fees, reminders] = await Promise.all([
    prisma.investor.findMany({
      where: { rmId: session.user.id },
      include: { expenses: true, monthlyFees: true },
    }),
    prisma.expense.findMany({
      where: { investor: { rmId: session.user.id } },
      include: { investor: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.monthlyFee.findMany({
      where: { investor: { rmId: session.user.id } },
    }),
    prisma.reminder.findMany({
      where: { userId: session.user.id, status: "PENDING" },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const paidExpenses = expenses.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
  const pendingExpenses = expenses.filter((e) => e.status === "PENDING").reduce((s, e) => s + Number(e.amount), 0);
  const overdueExpenses = expenses.filter((e) => e.status === "OVERDUE").reduce((s, e) => s + Number(e.amount), 0);

  const totalFees = fees.reduce((s, f) => s + Number(f.amount), 0);
  const paidFees = fees.filter((f) => f.status === "PAID").reduce((s, f) => s + Number(f.amount), 0);
  const pendingFees = fees.filter((f) => f.status === "PENDING").reduce((s, f) => s + Number(f.amount), 0);

  // Monthly chart data (last 6 months)
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const monthExpenses = expenses.filter((e) => {
      const ed = new Date(e.date);
      return ed.getMonth() + 1 === month && ed.getFullYear() === year;
    });
    const monthFees = fees.filter((f) => f.month === month && f.year === year);

    return {
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d),
      gastos: monthExpenses.reduce((s, e) => s + Number(e.amount), 0),
      mensalidades: monthFees.reduce((s, f) => s + Number(f.amount), 0),
    };
  });

  // Per investor breakdown
  const investorBreakdown = investors.map((inv) => ({
    id: inv.id,
    name: inv.name,
    totalExpenses: inv.expenses.reduce((s, e) => s + Number(e.amount), 0),
    totalFees: inv.monthlyFees.reduce((s, f) => s + Number(f.amount), 0),
    pendingCount: inv.expenses.filter((e) => e.status === "PENDING").length + inv.monthlyFees.filter((f) => f.status === "PENDING").length,
  }));

  return NextResponse.json({
    summary: {
      totalInvestors: investors.length,
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      overdueExpenses,
      totalFees,
      paidFees,
      pendingFees,
      pendingReminders: reminders.length,
    },
    monthlyData,
    investorBreakdown,
    recentReminders: reminders,
  });
}
