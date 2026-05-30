import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvestorsClient } from "@/components/rm/investors-client";

export default async function InvestorsPage() {
  const session = await auth();
  if (!session) return null;

  const investors = await prisma.investor.findMany({
    where: { rmId: session.user.id },
    include: {
      expenses: { select: { amount: true, status: true } },
      monthlyFees: { select: { amount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = investors.map((inv) => ({
    ...inv,
    amount: inv.expenses.reduce((s, e) => s + Number(e.amount), 0),
    pendingAmount:
      inv.expenses.filter((e) => e.status !== "PAID").reduce((s, e) => s + Number(e.amount), 0) +
      inv.monthlyFees.filter((f) => f.status !== "PAID").reduce((s, f) => s + Number(f.amount), 0),
    totalFees: inv.monthlyFees.reduce((s, f) => s + Number(f.amount), 0),
  }));

  return <InvestorsClient investors={data} formatCurrency={formatCurrency} formatDate={formatDate} />;
}
