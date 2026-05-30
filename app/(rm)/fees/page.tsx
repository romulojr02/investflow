import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FeesClient } from "@/components/rm/fees-client";

export default async function FeesPage() {
  const session = await auth();
  if (!session) return null;

  const [fees, investors] = await Promise.all([
    prisma.monthlyFee.findMany({
      where: { investor: { rmId: session.user.id } },
      include: { investor: { select: { id: true, name: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    prisma.investor.findMany({
      where: { rmId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = fees.map((f) => ({ ...f, amount: Number(f.amount) }));
  return <FeesClient fees={serialized} investors={investors} />;
}
