import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { EmailOtpType } from '@supabase/supabase-js';

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const tokenHash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
    const rawNextParam = requestUrl.searchParams.get('next');
    const isRecoveryFlow = type === 'recovery' || (!!code && !rawNextParam);
    const safeNext = rawNextParam?.startsWith('/')
        ? rawNextParam
        : isRecoveryFlow
            ? '/update-password'
            : '/';
    const supabase = await createClient();
    let authError = '';
    const isPasswordRecoveryDestination = safeNext === '/update-password' || isRecoveryFlow;

    // Recovery flows are browser-context sensitive (PKCE/local storage).
    // Do not complete recovery verification on the server callback route.
    if (code && !isPasswordRecoveryDestination) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            authError = error.message;
        }
    } else if (tokenHash && type && !isPasswordRecoveryDestination) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
        });
        if (error) {
            authError = error.message;
        }
    }

    const redirectUrl = new URL(`${requestUrl.origin}${safeNext}`);
    if (isRecoveryFlow && redirectUrl.pathname === '/') {
        redirectUrl.pathname = '/update-password';
    }
    if (code && isPasswordRecoveryDestination) {
        redirectUrl.searchParams.set('code', code);
        if (type) {
            redirectUrl.searchParams.set('type', type);
        }
    }
    if (tokenHash && type && isPasswordRecoveryDestination) {
        redirectUrl.searchParams.set('token_hash', tokenHash);
        redirectUrl.searchParams.set('type', type);
    }
    if (authError) {
        redirectUrl.searchParams.set('error', authError);
    }

    return NextResponse.redirect(redirectUrl);
}
