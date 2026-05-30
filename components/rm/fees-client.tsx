"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, CreditCard, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/lib/toast-context";
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils";

const MONTHS = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const schema = z.object({
  description: z.string().min(2),
  amount: z.string().min(1),
  dueDate: z.string().min(1),
  investorId: z.string().min(1, "Selecione um investidor"),
  month: z.string().min(1),
  year: z.string().min(4),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]),
});

type FormData = z.infer<typeof schema>;
type Fee = {
  id: string; description: string; amount: string | number; dueDate: Date;
  status: "PENDING" | "PAID" | "OVERDUE"; month: number; year: number; notes: string | null;
  investor: { id: string; name: string };
};

const sv = (s: string) => (s === "PAID" ? "paid" : s === "OVERDUE" ? "overdue" : "pending") as "paid" | "overdue" | "pending";
const sl = (s: string) => (s === "PAID" ? "Pago" : s === "OVERDUE" ? "Vencido" : "Pendente");

export function FeesClient({ fees: initial, investors }: { fees: Fee[]; investors: { id: string; name: string }[] }) {
  const { toast } = useToast();
  const [fees, setFees] = useState(initial);
  const [open, setOpen] = useState(false);
  const [filterInvestor, setFilterInvestor] = useState("all");

  const now = new Date();
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "PENDING",
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        amount: parseFloat(data.amount.replace(",", ".")),
        month: parseInt(data.month),
        year: parseInt(data.year),
      }),
    });
    if (!res.ok) { toast({ title: "Erro ao criar mensalidade", variant: "destructive" }); return; }
    const fee = await res.json();
    setFees((prev) => [fee, ...prev]);
    toast({ title: "Mensalidade adicionada!", variant: "success" });
    setOpen(false);
    reset();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "PAID" ? "PENDING" : "PAID";
    const res = await fetch(`/api/fees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFees((prev) => prev.map((f) => (f.id === id ? updated : f)));
      toast({ title: next === "PAID" ? "Marcado como pago!" : "Marcado como pendente", variant: next === "PAID" ? "success" : "default" });
    }
  };

  const filtered = fees.filter((f) => filterInvestor === "all" || f.investor.id === filterInvestor);
  const total = filtered.reduce((s, f) => s + Number(f.amount), 0);
  const paid = filtered.filter((f) => f.status === "PAID").reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mensalidades</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Total: <span className="font-semibold text-zinc-900">{formatCurrency(total)}</span>
            {" · "}Pago: <span className="font-semibold text-emerald-600">{formatCurrency(paid)}</span>
            {" · "}Pendente: <span className="font-semibold text-amber-600">{formatCurrency(total - paid)}</span>
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4" />Nova Mensalidade</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Mensalidade</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select onValueChange={(v) => setValue("investorId", v)}>
                <SelectTrigger label="Investidor *" error={errors.investorId?.message}>
                  <SelectValue placeholder="Selecione o investidor" />
                </SelectTrigger>
                <SelectContent>
                  {investors.map((inv) => <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input label="Descrição *" placeholder="ex: Taxa de gestão" error={errors.description?.message} {...register("description")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Valor (R$) *" placeholder="0,00" {...register("amount")} />
                <Input label="Vencimento *" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select onValueChange={(v) => setValue("month", v)} defaultValue={String(now.getMonth() + 1)}>
                  <SelectTrigger label="Mês">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input label="Ano" placeholder={String(now.getFullYear())} {...register("year")} />
              </div>
              <Select onValueChange={(v) => setValue("status", v as "PENDING" | "PAID" | "OVERDUE")} defaultValue="PENDING">
                <SelectTrigger label="Status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="OVERDUE">Vencido</SelectItem>
                </SelectContent>
              </Select>
              <Textarea label="Observações" placeholder="Notas..." {...register("notes")} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <Select onValueChange={setFilterInvestor} defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os investidores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os investidores</SelectItem>
            {investors.map((inv) => <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <CreditCard className="w-10 h-10 text-zinc-300" />
            <p className="text-zinc-500 font-medium">Nenhuma mensalidade encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100">
              {filtered.map((fee) => (
                <div key={fee.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">{fee.description}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {fee.investor.name} · {formatMonth(fee.month, fee.year)} · vence {formatDate(fee.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={sv(fee.status)}>{sl(fee.status)}</Badge>
                    <span className="text-sm font-semibold text-zinc-900 w-28 text-right">
                      {formatCurrency(Number(fee.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${fee.status === "PAID" ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"}`}
                      onClick={() => toggleStatus(fee.id, fee.status)}
                    >
                      {fee.status === "PAID" ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
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
