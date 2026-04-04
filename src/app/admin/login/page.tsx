'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign in with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // 2. Verified if user is actually an admin
            // The middleware will handle protection, but good to check here for better UX
            const { data: adminData, error: adminError } = await supabase
                .from('admin_users')
                .select('role')
                .eq('user_id', authData.user.id)
                .single();

            if (adminError || !adminData) {
                throw new Error('Unauthorized: Access restricted to administrators.');
            }

            // 3. Redirect to Dashboard
            router.push('/admin/dashboard');
            router.refresh();

        } catch (err: unknown) {
            console.error('Login failed:', err);
            const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
            if (message.includes('Invalid login credentials')) {
                setError('Invalid email or password.');
            } else {
                setError(message);
            }

            if (message.includes('Unauthorized')) {
                await supabase.auth.signOut();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                <div className="px-8 py-6">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-900/30 mb-4">
                            <Lock className="w-6 h-6 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Admin Portal</h2>
                        <p className="text-gray-400 mt-1">Sign in to manage the platform</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-3 rounded flex items-start gap-2 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:bg-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm transition duration-150 ease-in-out"
                                    placeholder="admin@sindoor.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm font-medium mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:bg-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:text-sm transition duration-150 ease-in-out"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {loading ? 'Authenticating...' : 'Access Dashboard'}
                        </button>
                    </form>
                </div>
                <div className="bg-gray-700/50 px-8 py-4 border-t border-gray-700">
                    <p className="text-xs text-center text-gray-400">
                        Authorized personnel only. All activities are monitored.
                    </p>
                </div>
            </div>
        </div>
    );
}
