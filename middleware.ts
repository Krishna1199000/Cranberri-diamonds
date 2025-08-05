import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/session';

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
  const isCustomerApprovalPage = path === '/customer-approval';

  // If no token and trying to access protected routes
  if (!token && (isAdminPage || isEmployeePage || isCustomerPage || isSyncPage || isDashboardPage || isAdminUsersPage || isCustomerApprovalPage)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Use getSession for all session validation
  if (token) {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    if (session.forcedLogout) {
      // Forced logout due to another device login
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('forcedLogout', '1');
      const response = NextResponse.redirect(url);
      response.cookies.delete('token');
      return response;
    }
    // Use session.role for role-based access
    const role = session.role;
    if (isAdminPage || isSyncPage || isAdminUsersPage) {
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }
    if (isEmployeePage) {
      if (role !== 'employee') {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }
    if (isCustomerPage) {
      if (role !== 'customer') {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }
    if (role === 'waiting_for_approval') {
      if (!isCustomerApprovalPage) {
        return NextResponse.redirect(new URL('/customer-approval', request.url));
      }
    }
    if (isDashboardPage) {
      if (role === 'customer') {
        return NextResponse.redirect(new URL('/Customer', request.url));
      }
    }
    if (isCustomerApprovalPage) {
      if (role !== 'waiting_for_approval') {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }
    // If on auth page and already logged in, redirect to dashboard
    if (isAuthPage) {
      let redirectUrl = '/';
      switch (role) {
        case 'admin':
          redirectUrl = '/Admins'; break;
        case 'employee':
          redirectUrl = '/employee'; break;
        case 'customer':
          redirectUrl = '/Customer'; break;
        default:
          redirectUrl = '/auth/signin';
      }
      return NextResponse.redirect(new URL(redirectUrl, request.url));
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
    '/admin/users',
    '/customer-approval'
  ]
};