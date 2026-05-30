import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, CreditCard, CheckCircle2 } from "lucide-react";

const sv = (s: string) => (s === "PAID" ? "paid" : s === "OVERDUE" ? "overdue" : "pending") as "paid" | "overdue" | "pending";
const sl = (s: string) => (s === "PAID" ? "Pago" : s === "OVERDUE" ? "Vencido" : "Pendente");

export default async function InvestorDashboard() {
  const session = await auth();
  if (!session) return null;

  const investor = await prisma.investor.findFirst({
    where: { userId: session.user.id },
    include: {
      expenses: { include: { supplier: true }, orderBy: { date: "desc" }, take: 10 },
      monthlyFees: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 10 },
    },
  });

  if (!investor) redirect("/login");

  const totalExpenses = investor.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const paidExpenses = investor.expenses.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
  const totalFees = investor.monthlyFees.reduce((s, f) => s + Number(f.amount), 0);
  const paidFees = investor.monthlyFees.filter((f) => f.status === "PAID").reduce((s, f) => s + Number(f.amount), 0);
  const pendingCount =
    investor.expenses.filter((e) => e.status !== "PAID").length +
    investor.monthlyFees.filter((f) => f.status !== "PAID").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Olá, {session.user.name.split(" ")[0]}</h1>
        <p className="text-sm text-zinc-500 mt-1">Resumo da sua conta</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">Total Gastos</span>
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Receipt className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-zinc-400 mt-1">{formatCurrency(paidExpenses)} pago</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">Mensalidades</span>
              <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-sky-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalFees)}</p>
            <p className="text-xs text-zinc-400 mt-1">{formatCurrency(paidFees)} pago</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">Pendente (gastos)</span>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Receipt className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalExpenses - paidExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">Pendente (mensalidades)</span>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalFees - paidFees)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {investor.expenses.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                <p className="text-sm text-zinc-400">Nenhum gasto registrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {investor.expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{exp.description}</p>
                      <p className="text-xs text-zinc-400">{formatDate(exp.date)}{exp.supplier && ` · ${exp.supplier.name}`}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={sv(exp.status)}>{sl(exp.status)}</Badge>
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
              <div className="flex flex-col items-center py-8 gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                <p className="text-sm text-zinc-400">Nenhuma mensalidade</p>
              </div>
            ) : (
              <div className="space-y-2">
                {investor.monthlyFees.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{fee.description}</p>
                      <p className="text-xs text-zinc-400">{formatMonth(fee.month, fee.year)} · vence {formatDate(fee.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={sv(fee.status)}>{sl(fee.status)}</Badge>
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
