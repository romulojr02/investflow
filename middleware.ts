import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const publicPaths = ["/login", "/register"];
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/investor") && session.user.role !== "INVESTOR") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const rmPaths = ["/dashboard", "/investors", "/suppliers", "/expenses", "/fees", "/notes", "/reminders"];
  if (rmPaths.some((p) => pathname.startsWith(p)) && session.user.role !== "RM") {
    return NextResponse.redirect(new URL("/investor/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
