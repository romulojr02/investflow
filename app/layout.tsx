import type { Metadata } from "next";
import "./globals.css";
import { ToastContextProvider } from "@/lib/toast-context";

export const metadata: Metadata = {
  title: "InvestFlow — Gestão de Investidores",
  description: "Plataforma de gestão de gastos e investidores",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full bg-zinc-50 text-zinc-900 antialiased">
        <ToastContextProvider>{children}</ToastContextProvider>
      </body>
    </html>
  );
}
