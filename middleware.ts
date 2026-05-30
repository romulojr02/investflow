import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname === "/login") return NextResponse.next();

  // /register é bloqueado — conta de admin já foi criada
  if (pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Rotas do investidor: /investor ou /investor/*
  const isInvestorRoute = pathname === "/investor" || pathname.startsWith("/investor/");
  if (isInvestorRoute && session.user.role !== "INVESTOR") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Rotas do RM
  const rmPaths = ["/dashboard", "/investors", "/suppliers", "/expenses", "/fees", "/notes", "/reminders"];
  if (rmPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) && session.user.role !== "RM") {
    return NextResponse.redirect(new URL("/investor/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
