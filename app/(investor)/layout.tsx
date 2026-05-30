import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { InvestorSidebar } from "@/components/investor/sidebar";

export default async function InvestorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "INVESTOR") redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <InvestorSidebar userName={session.user.name} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
