import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const statusVariant = (s: string) =>
  s === "PAID" ? "paid" : s === "OVERDUE" ? "overdue" : "pending";
const statusLabel = (s: string) =>
  s === "PAID" ? "Pago" : s === "OVERDUE" ? "Vencido" : "Pendente";

export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;
  const investor = await prisma.investor.findFirst({
    where: { id, rmId: session.user.id },
    include: {
      expenses: { include: { supplier: true }, orderBy: { date: "desc" } },
      monthlyFees: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });

  if (!investor) notFound();

  const totalExpenses = investor.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const paidExpenses = investor.expenses.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
  const totalFees = investor.monthlyFees.reduce((s, f) => s + Number(f.amount), 0);
  const paidFees = investor.monthlyFees.filter((f) => f.status === "PAID").reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/investors"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Investidores
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{investor.name}</h1>
        <div className="flex gap-4 mt-1 text-sm text-zinc-500">
          {investor.email && <span>{investor.email}</span>}
          {investor.phone && <span>{investor.phone}</span>}
          {investor.document && <span>{investor.document}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total gastos", value: formatCurrency(totalExpenses), sub: `${formatCurrency(paidExpenses)} pago` },
          { label: "Pendente gastos", value: formatCurrency(totalExpenses - paidExpenses) },
          { label: "Total mensalidades", value: formatCurrency(totalFees), sub: `${formatCurrency(paidFees)} pago` },
          { label: "Pendente mensalidades", value: formatCurrency(totalFees - paidFees) },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-zinc-400">{m.label}</p>
              <p className="text-xl font-bold text-zinc-900 mt-1">{m.value}</p>
              {m.sub && <p className="text-xs text-zinc-400 mt-0.5">{m.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {investor.expenses.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4">Nenhum gasto registrado</p>
            ) : (
              <div className="space-y-2">
                {investor.expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{exp.description}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(exp.date)}
                        {exp.supplier && ` · ${exp.supplier.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusVariant(exp.status) as "paid" | "pending" | "overdue"}>
                        {statusLabel(exp.status)}
                      </Badge>
                      <span className="text-sm font-semibold">{formatCurrency(Number(exp.amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensalidades</CardTitle>
          </CardHeader>
          <CardContent>
            {investor.monthlyFees.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4">Nenhuma mensalidade registrada</p>
            ) : (
              <div className="space-y-2">
                {investor.monthlyFees.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{fee.description}</p>
                      <p className="text-xs text-zinc-400">
                        {formatMonth(fee.month, fee.year)} · vence {formatDate(fee.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusVariant(fee.status) as "paid" | "pending" | "overdue"}>
                        {statusLabel(fee.status)}
                      </Badge>
                      <span className="text-sm font-semibold">{formatCurrency(Number(fee.amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
