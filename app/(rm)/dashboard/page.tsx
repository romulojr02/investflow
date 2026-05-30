import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "@/components/rm/dashboard-charts";
import {
  Users,
  Receipt,
  CreditCard,
  Bell,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [investors, expenses, fees, reminders] = await Promise.all([
    prisma.investor.findMany({ where: { rmId: session.user.id } }),
    prisma.expense.findMany({
      where: { investor: { rmId: session.user.id } },
      include: { investor: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.monthlyFee.findMany({
      where: { investor: { rmId: session.user.id } },
      include: { investor: { select: { name: true } } },
    }),
    prisma.reminder.findMany({
      where: { userId: session.user.id, status: "PENDING" },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const allExpenses = await prisma.expense.findMany({
    where: { investor: { rmId: session.user.id } },
  });

  const totalExpenses = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const paidExpenses = allExpenses.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);
  const pendingExpenses = allExpenses.filter((e) => e.status === "PENDING").reduce((s, e) => s + Number(e.amount), 0);

  const totalFees = fees.reduce((s, f) => s + Number(f.amount), 0);
  const paidFees = fees.filter((f) => f.status === "PAID").reduce((s, f) => s + Number(f.amount), 0);

  // Monthly data for charts
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const me = allExpenses.filter((e) => {
      const ed = new Date(e.date);
      return ed.getMonth() + 1 === month && ed.getFullYear() === year;
    });
    const mf = fees.filter((f) => f.month === month && f.year === year);
    return {
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d),
      gastos: me.reduce((s, e) => s + Number(e.amount), 0),
      mensalidades: mf.reduce((s, f) => s + Number(f.amount), 0),
    };
  });

  const statusVariant = (s: string) => {
    if (s === "PAID") return "paid";
    if (s === "OVERDUE") return "overdue";
    return "pending";
  };
  const statusLabel = (s: string) => {
    if (s === "PAID") return "Pago";
    if (s === "OVERDUE") return "Vencido";
    return "Pendente";
  };
  const priorityVariant = (p: string) => {
    if (p === "HIGH") return "high";
    if (p === "LOW") return "low";
    return "medium";
  };
  const priorityLabel = (p: string) => {
    if (p === "HIGH") return "Alta";
    if (p === "LOW") return "Baixa";
    return "Média";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Visão geral dos seus investidores e gastos</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-500">Investidores</span>
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{investors.length}</p>
            <p className="text-xs text-zinc-400 mt-1">ativos na carteira</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-500">Total Gastos</span>
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Receipt className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-zinc-400 mt-1">
              <span className="text-emerald-600 font-medium">{formatCurrency(paidExpenses)}</span> pago ·{" "}
              <span className="text-amber-600 font-medium">{formatCurrency(pendingExpenses)}</span> pendente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-500">Mensalidades</span>
              <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-sky-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(totalFees)}</p>
            <p className="text-xs text-zinc-400 mt-1">
              <span className="text-emerald-600 font-medium">{formatCurrency(paidFees)}</span> pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-500">Lembretes</span>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">{reminders.length}</p>
            <p className="text-xs text-zinc-400 mt-1">pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts data={monthlyData} />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimos Gastos</CardTitle>
              <TrendingUp className="w-4 h-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">Nenhum gasto cadastrado</p>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between gap-3 py-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{exp.description}</p>
                      <p className="text-xs text-zinc-400">
                        {exp.investor.name} · {formatDate(exp.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusVariant(exp.status) as "paid" | "pending" | "overdue"}>
                        {statusLabel(exp.status)}
                      </Badge>
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(Number(exp.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lembretes Pendentes</CardTitle>
              <Bell className="w-4 h-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="text-sm text-zinc-400">Tudo em dia!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((rem) => {
                  const isOverdue = new Date(rem.dueDate) < new Date();
                  return (
                    <div key={rem.id} className="flex items-start gap-3 py-1">
                      {isOverdue ? (
                        <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900">{rem.title}</p>
                        <p className="text-xs text-zinc-400">{formatDate(rem.dueDate)}</p>
                      </div>
                      <Badge variant={priorityVariant(rem.priority) as "high" | "medium" | "low"}>
                        {priorityLabel(rem.priority)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
