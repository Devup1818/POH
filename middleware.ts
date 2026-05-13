import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

// The OTP verification page — requires poh_2fa_pending cookie but no active session
const OTP_VERIFY_ROUTE = '/login/verify-otp';

// Session timeout: 30 minutes in milliseconds
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export async function middleware(request: NextRequest) {
  // Refresh the Supabase auth session and get user in a single call
  const { response, user, supabase } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const has2faPending = !!request.cookies.get('poh_2fa_pending')?.value;
  const isOtpVerifyRoute = pathname === OTP_VERIFY_ROUTE;
  const isLoginRoute = pathname === '/login';
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const is2faDisabled = process.env.DISABLE_OTP === 'true';

  // --- OTP Verification Page routing ---
  if (!is2faDisabled && isOtpVerifyRoute && !has2faPending) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!is2faDisabled && isOtpVerifyRoute && has2faPending) {
    return response;
  }

  // --- Session timeout check ---
  const lastActivity = request.cookies.get('poh_last_activity')?.value;
  const now = Date.now();
  let sessionTimedOut = false;

  if (user && lastActivity) {
    const lastActivityTime = parseInt(lastActivity, 10);
    if (!isNaN(lastActivityTime) && now - lastActivityTime > SESSION_TIMEOUT_MS) {
      sessionTimedOut = true;
    }
  }

  if (sessionTimedOut) {
    await supabase.auth.signOut();
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('reason', 'timeout');
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.cookies.delete('poh_last_activity');
    return redirectResponse;
  }

  // --- 2FA pending state enforcement ---
  if (!is2faDisabled && has2faPending && !isPublicRoute) {
    const otpUrl = new URL(OTP_VERIFY_ROUTE, request.url);
    return NextResponse.redirect(otpUrl);
  }

  // --- Login page routing ---
  if (isLoginRoute) {
    if (!is2faDisabled && user && has2faPending) {
      const otpUrl = new URL(OTP_VERIFY_ROUTE, request.url);
      return NextResponse.redirect(otpUrl);
    }

    if (user && !has2faPending) {
      const dashboardUrl = new URL('/', request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  }

  // --- Protected route access ---
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Update last activity timestamp for authenticated users
  if (user) {
    response.cookies.set('poh_last_activity', now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TIMEOUT_MS / 1000,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
