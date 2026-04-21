import { type NextRequest } from 'next/server'
import { updateSession } from './src/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    const hostHeader = request.headers.get('host') || '';
    const normalizedHost = hostHeader.toLowerCase();
    const isLocalhost = normalizedHost.startsWith('localhost') || normalizedHost.startsWith('127.0.0.1');

    // Enforce a single canonical host for production so auth/session storage
    // doesn't split between www and apex domains on mobile browsers.
    if (!isLocalhost && normalizedHost === 'sindoorsaubhagya.com') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.host = 'www.sindoorsaubhagya.com';
        redirectUrl.protocol = 'https:';
        return Response.redirect(redirectUrl, 308);
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/auth (auth routes) - Wait, we might want session on auth routes too if needed, but usually safe to exclude if public
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
