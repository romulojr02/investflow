import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sv = (s: string) => (s === "PAID" ? "paid" : s === "OVERDUE" ? "overdue" : "pending") as "paid" | "overdue" | "pending";
const sl = (s: string) => (s === "PAID" ? "Pago" : s === "OVERDUE" ? "Vencido" : "Pendente");

export default async function InvestorExpensesPage() {
  const session = await auth();
  if (!session) return null;

  const investor = await prisma.investor.findFirst({
    where: { userId: session.user.id },
    include: {
      expenses: { include: { supplier: true }, orderBy: { date: "desc" } },
    },
  });

  if (!investor) redirect("/login");

  const total = investor.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const paid = investor.expenses.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Meus Gastos</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Total: <span className="font-semibold text-zinc-900">{formatCurrency(total)}</span>
          {" · "}Pago: <span className="font-semibold text-emerald-600">{formatCurrency(paid)}</span>
          {" · "}Pendente: <span className="font-semibold text-amber-600">{formatCurrency(total - paid)}</span>
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {investor.expenses.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-zinc-400">Nenhum gasto registrado</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {investor.expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 truncate">{exp.description}</p>
                      {exp.category && (
                        <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full shrink-0">{exp.category}</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatDate(exp.date)}{exp.supplier && ` · ${exp.supplier.name}`}
                    </p>
                    {exp.notes && <p className="text-xs text-zinc-500 mt-1">{exp.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={sv(exp.status)}>{sl(exp.status)}</Badge>
                    <span className="text-sm font-semibold text-zinc-900">{formatCurrency(Number(exp.amount))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
