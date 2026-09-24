import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const authRoutes = new Set(["/signin", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check only: reads the session cookie, does not hit the
  // database. Routes and Server Actions must still verify the real
  // session themselves (see lib/auth-session.ts).
  const sessionCookie = getSessionCookie(request);
  const isAuthRoute = authRoutes.has(pathname);

  if (!sessionCookie && !isAuthRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
