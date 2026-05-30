import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuppliersClient } from "@/components/rm/suppliers-client";

export default async function SuppliersPage() {
  const session = await auth();
  if (!session) return null;

  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { expenses: true } } },
    orderBy: { name: "asc" },
  });

  return <SuppliersClient suppliers={suppliers} />;
}
