import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(2),
  content: z.string().min(1),
  amount: z.number().optional().nullable(),
  date: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const notes = await prisma.personalNote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "RM") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const note = await prisma.personalNote.create({
      data: {
        title: data.title,
        content: data.content,
        amount: data.amount ?? null,
        date: data.date ? new Date(data.date) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: (err as z.ZodError).issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
