"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/lib/toast-context";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2, "Título muito curto"),
  content: z.string().min(1, "Conteúdo obrigatório"),
  amount: z.string().optional(),
  date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Note = { id: string; title: string; content: string; amount: string | number | null; date: Date | null; createdAt: Date };

export function NotesClient({ notes: initial }: { notes: Note[] }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState(initial);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        amount: data.amount ? parseFloat(data.amount.replace(",", ".")) : null,
        date: data.date || null,
      }),
    });
    if (!res.ok) { toast({ title: "Erro ao salvar anotação", variant: "destructive" }); return; }
    const note = await res.json();
    setNotes((prev) => [note, ...prev]);
    toast({ title: "Anotação salva!", variant: "success" });
    setOpen(false);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta anotação?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast({ title: "Anotação removida" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Anotações Pessoais</h1>
          <p className="text-sm text-zinc-500 mt-1">{notes.length} anotaç{notes.length !== 1 ? "ões" : "ão"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4" />Nova Anotação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Anotação</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Título *" placeholder="ex: Gasto com escritório" error={errors.title?.message} {...register("title")} />
              <Textarea label="Conteúdo *" placeholder="Detalhe da anotação..." className="min-h-[120px]" error={errors.content?.message} {...register("content")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Valor (R$)" placeholder="0,00" {...register("amount")} />
                <Input label="Data" type="date" {...register("date")} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <StickyNote className="w-10 h-10 text-zinc-300" />
            <p className="text-zinc-500 font-medium">Nenhuma anotação</p>
            <p className="text-sm text-zinc-400">Registre gastos pessoais e observações</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-zinc-900 text-sm leading-snug">{note.title}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-rose-400 hover:text-rose-600 hover:bg-rose-50 -mt-0.5 -mr-1 shrink-0"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
                  <span className="text-xs text-zinc-400">{formatDate(note.createdAt)}</span>
                  {note.amount && (
                    <span className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {formatCurrency(Number(note.amount))}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
