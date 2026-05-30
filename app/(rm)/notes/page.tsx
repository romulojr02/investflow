import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotesClient } from "@/components/rm/notes-client";

export default async function NotesPage() {
  const session = await auth();
  if (!session) return null;

  const notes = await prisma.personalNote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = notes.map((n) => ({ ...n, amount: n.amount ? Number(n.amount) : null }));
  return <NotesClient notes={serialized} />;
}
