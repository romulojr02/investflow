import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RemindersClient } from "@/components/rm/reminders-client";

export default async function RemindersPage() {
  const session = await auth();
  if (!session) return null;

  const reminders = await prisma.reminder.findMany({
    where: { userId: session.user.id, status: "PENDING" },
    orderBy: { dueDate: "asc" },
  });

  return <RemindersClient reminders={reminders} />;
}
