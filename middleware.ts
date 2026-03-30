import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_token';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Simple JWT decode without verify (edge runtime limitation)
// Full verify happens in API routes
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/* except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !decodeJwt(token)) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/admin/* routes
  if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/auth') {
    const token = request.cookies.get(COOKIE_NAME)?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !decodeJwt(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
