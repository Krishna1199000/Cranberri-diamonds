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
  const path = request.nextUrl.pathname;
  
  const isAuthPage = path.startsWith('/auth');
  const isAdminPage = path.startsWith('/Admins');
  const isEmployeePage = path.startsWith('/employee');
  const isCustomerPage = path.startsWith('/Customer');
  const isSyncPage = path.startsWith('/sync');
  const isDashboardPage = path === '/dashboard';
  const isAdminUsersPage = path === '/admin/users';

  // If no token and trying to access protected routes
  if (!token && (isAdminPage || isEmployeePage || isCustomerPage || isSyncPage || isDashboardPage || isAdminUsersPage)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // If has token and trying to access auth pages
  if (token && isAuthPage) {
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Redirect to appropriate dashboard based on role
    switch (payload.role) {
      case 'admin':
        return NextResponse.redirect(new URL('/Admins', request.url));
      case 'employee':
        return NextResponse.redirect(new URL('/employee', request.url));
      case 'customer':
        return NextResponse.redirect(new URL('/Customer', request.url));
      default:
        return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  // For protected routes, verify role access
  if (token) {
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Role-based access control
    if (isAdminPage || isSyncPage || isAdminUsersPage) {
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }

    if (isEmployeePage) {
      if (payload.role !== 'employee') {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }

    if (isCustomerPage) {
      if (payload.role !== 'customer') {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }

    // Dashboard access control - restrict customers
    if (isDashboardPage) {
      if (payload.role === 'customer') {
        return NextResponse.redirect(new URL('/Customer', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/employee/:path*',
    '/Customer/:path*',
    '/auth/:path*',
    '/sync/:path*',
    '/Admins/:path*',
    '/dashboard',
    '/admin/users'
  ]
};