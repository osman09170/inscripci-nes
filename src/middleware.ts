import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Redirigir a login si no hay sesión
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirigir según rol si accede a rutas incorrectas
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/secretary/dashboard", request.url));
  }

  if (pathname.startsWith("/secretary") && token.role !== "SECRETARY") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/secretary/:path*"],
};
