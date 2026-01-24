import { NextResponse, type NextRequest } from 'next/server';

// List of protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/tailor', '/admin'];
// List of API routes that require authentication
const protectedApiRoutes = ['/api/user', '/api/razorpay/order', '/api/razorpay/verify'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));

    // 2. Get authentication token (Firebase uses __session or custom cookies frequently in SSR)
    // Since we are using Firebase Client-side auth, we rely on a cookie for Middleware-level protection.
    // Note: Firebase doesn't set cookies automatically unless configured with session cookies.
    // For this implementation, we assume a "session" cookie is present if the user is logged in.
    const session = request.cookies.get('__session');

    if (isProtectedRoute && !session) {
        // Redirect to login if accessing a protected page
        const url = new URL('/', request.url);
        // url.searchParams.set('callbackUrl', encodeURI(pathname)); // Optional: to redirect back after login
        return NextResponse.redirect(url);
    }

    if (isProtectedApiRoute && !session) {
        // Return 401 for unauthorized API access
        return new NextResponse(
            JSON.stringify({ error: 'Unauthorized access' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
        );
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Slightly more permissive CSP for development and analytics
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' *.posthog.com *.google-analytics.com *.razorpay.com apis.google.com www.gstatic.com www.googletagmanager.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: *.googleusercontent.com *.posthog.com *.razorpay.com raw.githubusercontent.com;
        font-src 'self' data:;
        connect-src 'self' *.googleapis.com *.firebasestorage.app *.firebaseapp.com *.posthog.com *.sentry.io *.razorpay.com raw.githubusercontent.com;
        frame-src 'self' *.razorpay.com *.firebaseapp.com accounts.google.com;
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public assets)
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
