"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Truck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/lib/toast-context";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  category: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Supplier = { id: string; name: string; category: string | null; contact: string | null; email: string | null; notes: string | null; _count: { expenses: number } };

export function SuppliersClient({ suppliers: initial }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState(initial);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast({ title: "Erro ao criar fornecedor", variant: "destructive" }); return; }
    const supplier = await res.json();
    setSuppliers((prev) => [...prev, { ...supplier, _count: { expenses: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: "Fornecedor criado!", variant: "success" });
    setOpen(false);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este fornecedor?")) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Fornecedor removido" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Fornecedores</h1>
          <p className="text-sm text-zinc-500 mt-1">{suppliers.length} cadastrado{suppliers.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4" />Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Nome *" placeholder="Nome do fornecedor" error={errors.name?.message} {...register("name")} />
              <Input label="Categoria" placeholder="ex: Tecnologia, Serviços..." {...register("category")} />
              <Input label="Contato" placeholder="Pessoa de contato" {...register("contact")} />
              <Input label="E-mail" type="email" placeholder="fornecedor@email.com" error={errors.email?.message} {...register("email")} />
              <Textarea label="Notas" placeholder="Informações adicionais..." {...register("notes")} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? "Criando..." : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Truck className="w-10 h-10 text-zinc-300" />
            <p className="text-zinc-500 font-medium">Nenhum fornecedor cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <Card key={sup.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-zinc-900">{sup.name}</p>
                    {sup.category && <p className="text-xs text-zinc-400 mt-0.5">{sup.category}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDelete(sup.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-zinc-500">
                  {sup.contact && <p>Contato: {sup.contact}</p>}
                  {sup.email && <p>{sup.email}</p>}
                  <p className="text-zinc-400">{sup._count.expenses} gasto{sup._count.expenses !== 1 ? "s" : ""} registrado{sup._count.expenses !== 1 ? "s" : ""}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
