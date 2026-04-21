"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './forgot-password.module.css';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
            const runtimeOrigin = window.location.origin.replace(/\/$/, '');
            const configuredIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredSiteUrl || '');
            const runtimeIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(runtimeOrigin);

            // Guard against production builds accidentally carrying localhost SITE_URL.
            const appOrigin = (!runtimeIsLocalhost && configuredIsLocalhost)
                ? runtimeOrigin
                : (configuredSiteUrl || runtimeOrigin);

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${appOrigin}/auth/callback?next=/update-password`,
            });

            if (error) throw error;

            setMessage("Check your email for the password reset link.");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to send reset email.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Forgot Password?</h1>
                <p className={styles.subtitle}>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                {message && <div className={styles.successMessage}>{message}</div>}
                {error && <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <Link href="/" className={styles.backLink}>
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </form>
            </div>
        </div>
    );
}
