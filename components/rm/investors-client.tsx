"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/toast-context";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  document: z.string().optional(),
  notes: z.string().optional(),
  createLogin: z.boolean().optional(),
  loginPassword: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Investor = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  createdAt: string;
  amount: number;
  pendingAmount: number;
  totalFees: number;
};

export function InvestorsClient({ investors: initial }: { investors: Investor[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [investors, setInvestors] = useState(initial);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { createLogin: false },
  });

  const createLogin = watch("createLogin");

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/investors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast({ title: "Erro ao criar investidor", variant: "destructive" });
      return;
    }

    toast({ title: "Investidor criado com sucesso!", variant: "success" });
    setOpen(false);
    reset();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Isso removerá todos os gastos associados.")) return;
    setDeleting(id);
    await fetch(`/api/investors/${id}`, { method: "DELETE" });
    setInvestors((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
    toast({ title: "Investidor removido", variant: "default" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Investidores</h1>
          <p className="text-sm text-zinc-500 mt-1">{investors.length} cadastrado{investors.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Novo Investidor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Investidor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Nome completo *" placeholder="Nome do investidor" error={errors.name?.message} {...register("name")} />
              <Input label="E-mail" type="email" placeholder="investidor@email.com" error={errors.email?.message} {...register("email")} />
              <Input label="Telefone" placeholder="(11) 99999-9999" {...register("phone")} />
              <Input label="CPF / CNPJ" placeholder="000.000.000-00" {...register("document")} />
              <Textarea label="Observações" placeholder="Notas sobre o investidor..." {...register("notes")} />

              <div className="border-t border-zinc-100 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" {...register("createLogin")} />
                  <span className="text-sm font-medium text-zinc-700">Criar acesso para o investidor</span>
                </label>
                {createLogin && (
                  <div className="mt-3">
                    <Input
                      label="Senha de acesso"
                      type="password"
                      placeholder="••••••••"
                      {...register("loginPassword")}
                    />
                    <p className="text-xs text-zinc-400 mt-1">O investidor usará o e-mail acima para fazer login.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset(); }}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar Investidor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {investors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-zinc-300" />
            <p className="text-zinc-500 font-medium">Nenhum investidor cadastrado</p>
            <p className="text-sm text-zinc-400">Clique em &quot;Novo Investidor&quot; para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {investors.map((inv) => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-zinc-900">{inv.name}</p>
                    {inv.email && <p className="text-xs text-zinc-400 mt-0.5">{inv.email}</p>}
                    {inv.document && <p className="text-xs text-zinc-400">{inv.document}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/investors/${inv.id}`)}
                      className="h-7 w-7"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => handleDelete(inv.id)}
                      disabled={deleting === inv.id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                  <div>
                    <p className="text-xs text-zinc-400">Total gastos</p>
                    <p className="text-sm font-semibold text-zinc-900">{formatCurrency(inv.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Pendente</p>
                    <p className={`text-sm font-semibold ${inv.pendingAmount > 0 ? "text-amber-600" : "text-zinc-900"}`}>
                      {formatCurrency(inv.pendingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Mensalidades</p>
                    <p className="text-sm font-semibold text-zinc-900">{formatCurrency(inv.totalFees)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Desde</p>
                    <p className="text-sm text-zinc-600">{formatDate(inv.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
