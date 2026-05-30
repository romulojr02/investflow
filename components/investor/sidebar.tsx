"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Receipt, CreditCard, LogOut, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/investor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investor/expenses", label: "Meus Gastos", icon: Receipt },
  { href: "/investor/fees", label: "Mensalidades", icon: CreditCard },
];

export function InvestorSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 bg-zinc-900 min-h-screen shrink-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-800">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-zinc-900" />
        </div>
        <span className="text-white font-semibold text-sm">InvestFlow</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-white text-zinc-900" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-zinc-500">Investidor</p>
          <p className="text-sm text-white font-medium truncate">{userName}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
