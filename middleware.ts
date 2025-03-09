import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Helper function to verify token
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || '')
    );
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isSyncPage = request.nextUrl.pathname.startsWith('/sync');

  // If no token and trying to access protected routes
  if (!token && (isDashboardPage || isAdminPage || isSyncPage)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // If has token and trying to access auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // For protected routes, verify role access
  if (token && (isDashboardPage || isAdminPage || isSyncPage)) {
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Admin-only routes
    if ((isAdminPage || isSyncPage) && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/admin/:path*', '/sync/:path*']
};