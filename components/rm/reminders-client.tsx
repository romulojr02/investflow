"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Bell, Check, AlertCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

type FormData = z.infer<typeof schema>;

type Reminder = { id: string; title: string; description: string | null; dueDate: Date; status: string; priority: "LOW" | "MEDIUM" | "HIGH" };

const pv = (p: string) => (p === "HIGH" ? "high" : p === "LOW" ? "low" : "medium") as "high" | "medium" | "low";
const pl = (p: string) => (p === "HIGH" ? "Alta" : p === "LOW" ? "Baixa" : "Média");

export function RemindersClient({ reminders: initial }: { reminders: Reminder[] }) {
  const { toast } = useToast();
  const [reminders, setReminders] = useState(initial);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM", dueDate: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast({ title: "Erro ao criar lembrete", variant: "destructive" }); return; }
    const reminder = await res.json();
    setReminders((prev) => [...prev, reminder].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    toast({ title: "Lembrete criado!", variant: "success" });
    setOpen(false);
    reset();
  };

  const handleComplete = async (id: string) => {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Lembrete concluído!", variant: "success" });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Lembrete removido" });
  };

  const overdue = reminders.filter((r) => new Date(r.dueDate) < new Date());
  const upcoming = reminders.filter((r) => new Date(r.dueDate) >= new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lembretes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {reminders.length} pendente{reminders.length !== 1 ? "s" : ""}
            {overdue.length > 0 && <span className="text-rose-500 ml-1">· {overdue.length} vencido{overdue.length !== 1 ? "s" : ""}</span>}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4" />Novo Lembrete</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo Lembrete</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Título *" placeholder="ex: Comprar ações de X" error={errors.title?.message} {...register("title")} />
              <Textarea label="Descrição" placeholder="Detalhes do lembrete..." {...register("description")} />
              <Input label="Data limite *" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
              <Select onValueChange={(v) => setValue("priority", v as "LOW" | "MEDIUM" | "HIGH")} defaultValue="MEDIUM">
                <SelectTrigger label="Prioridade"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? "Criando..." : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell className="w-10 h-10 text-zinc-300" />
            <p className="text-zinc-500 font-medium">Nenhum lembrete pendente</p>
            <p className="text-sm text-emerald-500 font-medium">Tudo em dia!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-rose-600 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Vencidos
              </h2>
              <div className="space-y-2">
                {overdue.map((rem) => (
                  <ReminderCard key={rem.id} reminder={rem} onComplete={handleComplete} onDelete={handleDelete} overdue />
                ))}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Próximos
              </h2>
              <div className="space-y-2">
                {upcoming.map((rem) => (
                  <ReminderCard key={rem.id} reminder={rem} onComplete={handleComplete} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReminderCard({
  reminder,
  onComplete,
  onDelete,
  overdue = false,
}: {
  reminder: Reminder;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  overdue?: boolean;
}) {
  return (
    <Card className={overdue ? "border-rose-200" : ""}>
      <CardContent className="flex items-center gap-4 py-4 px-5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${overdue ? "bg-rose-50" : "bg-amber-50"}`}>
          {overdue ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <Clock className="w-4 h-4 text-amber-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-900 truncate">{reminder.title}</p>
            <Badge variant={pv(reminder.priority)}>{pl(reminder.priority)}</Badge>
          </div>
          {reminder.description && <p className="text-xs text-zinc-500 mt-0.5 truncate">{reminder.description}</p>}
          <p className={`text-xs mt-0.5 ${overdue ? "text-rose-500 font-medium" : "text-zinc-400"}`}>
            {overdue ? "Venceu em " : "Até "}{formatDate(reminder.dueDate)}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => onComplete(reminder.id)}
            title="Concluir"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
            onClick={() => onDelete(reminder.id)}
            title="Remover"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
