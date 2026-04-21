"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import styles from './update-password.module.css';
import { supabase } from '@/lib/supabase';

export default function UpdatePassword() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sessionReady, setSessionReady] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const bootstrapRecoverySession = async () => {
            const params = new URLSearchParams(window.location.search);
            const urlError = params.get('error') || params.get('error_description');
            if (urlError) {
                setError(urlError);
                return;
            }

            const code = params.get('code');
            const tokenHash = params.get('token_hash');
            const tokenType = params.get('type');
            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    if (/pkce code verifier not found/i.test(exchangeError.message)) {
                        setError('Reset link is tied to a different browser session. Please open the latest reset link in the same browser where you requested it, or request a new link and open it here.');
                    } else {
                        setError(exchangeError.message);
                    }
                    return;
                }

                const cleanedParams = new URLSearchParams(window.location.search);
                cleanedParams.delete('code');
                cleanedParams.delete('type');
                cleanedParams.delete('next');
                cleanedParams.delete('error');
                cleanedParams.delete('error_description');
                const cleanedQuery = cleanedParams.toString();
                window.history.replaceState(
                    {},
                    document.title,
                    `${window.location.pathname}${cleanedQuery ? `?${cleanedQuery}` : ''}${window.location.hash}`
                );
            }

            if (!code && tokenHash && tokenType) {
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: tokenType as 'recovery',
                });

                if (verifyError) {
                    setError(verifyError.message);
                    return;
                }

                const cleanedParams = new URLSearchParams(window.location.search);
                cleanedParams.delete('token_hash');
                cleanedParams.delete('type');
                cleanedParams.delete('next');
                cleanedParams.delete('error');
                cleanedParams.delete('error_description');
                const cleanedQuery = cleanedParams.toString();
                window.history.replaceState(
                    {},
                    document.title,
                    `${window.location.pathname}${cleanedQuery ? `?${cleanedQuery}` : ''}${window.location.hash}`
                );
            }

            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
                const { error: setSessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (setSessionError) {
                    setError(setSessionError.message);
                    return;
                }

                // Remove tokens from URL after consuming them.
                window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
            }

            let recoveredSession = null;
            let sessionError: Error | null = null;

            for (let attempt = 0; attempt < 5; attempt += 1) {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    sessionError = error;
                    break;
                }

                if (data.session?.user) {
                    recoveredSession = data.session;
                    break;
                }

                await new Promise((resolve) => setTimeout(resolve, 250));
            }

            if (sessionError) {
                setError(sessionError.message);
                return;
            }

            if (!recoveredSession?.user) {
                setError('Reset link is invalid or expired. Please request a new reset link.');
                return;
            }

            setSessionReady(true);
        };

        void bootstrapRecoverySession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionReady) return;
        setLoading(true);
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage("Password updated successfully. Redirecting to home...");
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update password";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Update Password</h1>
                <p className={styles.subtitle}>
                    Enter your new password below.
                </p>

                {message && <div className={styles.successMessage}>{message}</div>}
                {error && <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="password">New Password</label>
                        <div className={styles.inputWrapper}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="At least 8 characters"
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                        <div className={styles.inputWrapper}>
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                className={styles.input}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className={styles.button} disabled={loading || !sessionReady}>
                        {loading ? 'Updating...' : sessionReady ? 'Update Password' : 'Preparing secure reset session...'}
                    </button>
                </form>
                {!sessionReady && !error && (
                    <p style={{ marginTop: '16px', color: '#6b7280' }}>Preparing secure reset session...</p>
                )}
            </div>
        </div>
    );
}

