import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run Supabase code in completely public routes to save performance if needed, 
    // but usually we want to refresh session everywhere or specific protected routes.
    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new Response object, you must include the set-cookie headers from supabaseResponse.

    const pathname = request.nextUrl.pathname;
    const isAdminRoute = pathname.startsWith('/admin');
    const isMemberRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');

    // PROTECTED ROUTE LOGIC
    // 1. Check for /admin routes
    if (isAdminRoute) {
        const { data: { user } } = await supabase.auth.getUser();

        // Allow access to login page without auth
        if (pathname === '/admin/login') {
            if (user) {
                // If already logged in, check if admin before redirecting to dashboard
                // This prevents infinite redirect loop if redirects back to login on failure
            }
            return supabaseResponse;
        }

        // If not logged in, redirect to admin login
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin/login';
            return NextResponse.redirect(url);
        }

        // If logged in, verify admin status
        // We use the secure function or direct query. 
        // Direct query to admin_users is fine if policies allow select for self (which they do via is_admin function now)
        const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (!adminUser) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    if (isMemberRoute) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        const { data: memberProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (!memberProfile) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse
}
