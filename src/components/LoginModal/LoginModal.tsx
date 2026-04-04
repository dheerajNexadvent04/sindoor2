
"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, Heart, Eye, EyeOff } from 'lucide-react';
import styles from './LoginModal.module.css';
import { supabase } from '@/lib/supabase';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignUpClick: () => void;
}

const LoginModal = ({ isOpen, onClose, onSignUpClick }: LoginModalProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingRedirect, setPendingRedirect] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (pendingRedirect && session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                setLoading(false);
                setError(null);
                setPendingRedirect(false);
                onClose();
                router.replace('/dashboard');
                router.refresh();
            }
        });

        return () => subscription.unsubscribe();
    }, [pendingRedirect, onClose, router]);

    if (!isOpen) return null;

    // Close on overlay click
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPendingRedirect(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            setLoading(false);
            setPendingRedirect(false);
            onClose();
            router.replace('/dashboard');
            router.refresh();
        } catch (err: unknown) {
            setPendingRedirect(false);
            const message = err instanceof Error ? err.message : "Failed to login";
            if (message.includes("Email not confirmed")) {
                setError("Please verify your email before logging in.");
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={20} color="#333" />
                </button>

                {/* Header Image */}
                <div className={styles.headerImageContainer}>
                    <Image
                        src="/couple-traditional.png"
                        alt="Welcome"
                        fill
                        className={styles.headerImage}
                    />
                    <div className={styles.headerOverlay}>
                        <div className={styles.headerTitle}>
                            Find your forever <Heart size={20} className={styles.heartIcon} fill="#E31E24" />
                        </div>
                        <div className={styles.headerSubtitle}>
                            Discover a world beyond matrimony
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className={styles.formContainer}>
                    <h2 className={styles.welcomeTitle}>Welcome Back!</h2>
                    <p className={styles.subtitleRow}>
                        Don't have an account? <span className={styles.signupLink} onClick={onSignUpClick}>Sign up</span>
                    </p>

                    <form onSubmit={handleLogin}>
                        <div className={styles.formGroup}>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} size={20} />
                                <input
                                    type="email"
                                    placeholder="Example@email.com"
                                    className={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    className={styles.input}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.eyeButton}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} className={styles.eyeIcon} />
                                    ) : (
                                        <Eye size={20} className={styles.eyeIcon} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && <p style={{ color: 'red', fontSize: '0.9rem', marginBottom: '10px' }}>{error}</p>}

                        <div className={styles.optionsRow}>
                            <label className={styles.rememberMe}>
                                <input type="checkbox" className={styles.checkbox} /> Remember me
                            </label>
                            <Link href="/forgot-password" className={styles.forgotPassword} onClick={onClose}>
                                Forgot Password?
                            </Link>
                        </div>

                        <button type="submit" className={styles.loginBtn} disabled={loading}>
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
