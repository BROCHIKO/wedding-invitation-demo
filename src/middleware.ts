import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes, but exclude /admin/login and static/api resources
  if (pathname === '/admin' || (pathname.startsWith('/admin/') && pathname !== '/admin/login')) {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Simple authentication check using the password value
    if (sessionCookie !== adminPassword) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
