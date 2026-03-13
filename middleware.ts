import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Protected routes that require authentication
  const protectedRoutes = ['/submit'];
  
  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    // Check for Better Auth session cookie
    // In production (HTTPS), Better Auth sets __Secure- prefixed cookies
    const sessionToken =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('__Secure-better-auth.session_token');

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}