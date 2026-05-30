import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sv = (s: string) => (s === "PAID" ? "paid" : s === "OVERDUE" ? "overdue" : "pending") as "paid" | "overdue" | "pending";
const sl = (s: string) => (s === "PAID" ? "Pago" : s === "OVERDUE" ? "Vencido" : "Pendente");

export default async function InvestorFeesPage() {
  const session = await auth();
  if (!session) return null;

  const investor = await prisma.investor.findFirst({
    where: { userId: session.user.id },
    include: {
      monthlyFees: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });

  if (!investor) redirect("/login");

  const total = investor.monthlyFees.reduce((s, f) => s + Number(f.amount), 0);
  const paid = investor.monthlyFees.filter((f) => f.status === "PAID").reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Mensalidades</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Total: <span className="font-semibold text-zinc-900">{formatCurrency(total)}</span>
          {" · "}Pago: <span className="font-semibold text-emerald-600">{formatCurrency(paid)}</span>
          {" · "}Pendente: <span className="font-semibold text-amber-600">{formatCurrency(total - paid)}</span>
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {investor.monthlyFees.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-zinc-400">Nenhuma mensalidade registrada</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {investor.monthlyFees.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">{fee.description}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatMonth(fee.month, fee.year)} · vence {formatDate(fee.dueDate)}
                    </p>
                    {fee.notes && <p className="text-xs text-zinc-500 mt-1">{fee.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={sv(fee.status)}>{sl(fee.status)}</Badge>
                    <span className="text-sm font-semibold text-zinc-900">{formatCurrency(Number(fee.amount))}</span>
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
