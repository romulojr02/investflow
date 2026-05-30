"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Receipt, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/lib/toast-context";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  description: z.string().min(2),
  amount: z.string().min(1),
  date: z.string().min(1),
  investorId: z.string().min(1, "Selecione um investidor"),
  supplierId: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]),
});

type FormData = z.infer<typeof schema>;

type Expense = {
  id: string;
  description: string;
  amount: string | number;
  date: Date;
  status: "PENDING" | "PAID" | "OVERDUE";
  category: string | null;
  notes: string | null;
  investor: { id: string; name: string };
  supplier: { id: string; name: string } | null;
};

const statusVariant = (s: string) => (s === "PAID" ? "paid" : s === "OVERDUE" ? "overdue" : "pending") as "paid" | "overdue" | "pending";
const statusLabel = (s: string) => (s === "PAID" ? "Pago" : s === "OVERDUE" ? "Vencido" : "Pendente");

export function ExpensesClient({
  expenses: initial,
  investors,
  suppliers,
}: {
  expenses: Expense[];
  investors: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
}) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState(initial);
  const [open, setOpen] = useState(false);
  const [filterInvestor, setFilterInvestor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "PENDING", date: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, amount: parseFloat(data.amount.replace(",", ".")) }),
    });
    if (!res.ok) { toast({ title: "Erro ao criar gasto", variant: "destructive" }); return; }
    const expense = await res.json();
    setExpenses((prev) => [expense, ...prev]);
    toast({ title: "Gasto adicionado!", variant: "success" });
    setOpen(false);
    reset();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "PAID" ? "PENDING" : "PAID";
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      const updated = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast({ title: next === "PAID" ? "Marcado como pago!" : "Marcado como pendente", variant: next === "PAID" ? "success" : "default" });
    }
  };

  const filtered = expenses.filter((e) => {
    if (filterInvestor !== "all" && e.investor.id !== filterInvestor) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    return true;
  });

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const paidFiltered = filtered.filter((e) => e.status === "PAID").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gastos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Total: <span className="font-semibold text-zinc-900">{formatCurrency(totalFiltered)}</span>
            {" · "}Pago: <span className="font-semibold text-emerald-600">{formatCurrency(paidFiltered)}</span>
            {" · "}Pendente: <span className="font-semibold text-amber-600">{formatCurrency(totalFiltered - paidFiltered)}</span>
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4" />Novo Gasto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select onValueChange={(v) => setValue("investorId", v)}>
                <SelectTrigger label="Investidor *" error={errors.investorId?.message}>
                  <SelectValue placeholder="Selecione o investidor" />
                </SelectTrigger>
                <SelectContent>
                  {investors.map((inv) => <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input label="Descrição *" placeholder="ex: Consultoria jurídica" error={errors.description?.message} {...register("description")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Valor (R$) *" placeholder="0,00" error={errors.amount?.message} {...register("amount")} />
                <Input label="Data *" type="date" error={errors.date?.message} {...register("date")} />
              </div>
              <Select onValueChange={(v) => setValue("supplierId", v)}>
                <SelectTrigger label="Fornecedor">
                  <SelectValue placeholder="Selecionar fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input label="Categoria" placeholder="ex: Jurídico, TI, Marketing..." {...register("category")} />
              <Select onValueChange={(v) => setValue("status", v as "PENDING" | "PAID" | "OVERDUE")} defaultValue="PENDING">
                <SelectTrigger label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="OVERDUE">Vencido</SelectItem>
                </SelectContent>
              </Select>
              <Textarea label="Observações" placeholder="Detalhes adicionais..." {...register("notes")} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select onValueChange={setFilterInvestor} defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os investidores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os investidores</SelectItem>
            {investors.map((inv) => <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={setFilterStatus} defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="OVERDUE">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Receipt className="w-10 h-10 text-zinc-300" />
            <p className="text-zinc-500 font-medium">Nenhum gasto encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100">
              {filtered.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 truncate">{exp.description}</p>
                      {exp.category && (
                        <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full shrink-0">
                          {exp.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {exp.investor.name}
                      {exp.supplier && ` · ${exp.supplier.name}`}
                      {" · "}{formatDate(exp.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={statusVariant(exp.status)}>{statusLabel(exp.status)}</Badge>
                    <span className="text-sm font-semibold text-zinc-900 w-28 text-right">
                      {formatCurrency(Number(exp.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${exp.status === "PAID" ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"}`}
                      onClick={() => toggleStatus(exp.id, exp.status)}
                      title={exp.status === "PAID" ? "Marcar como pendente" : "Marcar como pago"}
                    >
                      {exp.status === "PAID" ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
