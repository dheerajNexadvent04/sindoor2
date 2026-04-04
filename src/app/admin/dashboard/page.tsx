'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Users, UserPlus, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingProfiles: 0,
        approvedProfiles: 0
    });
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const [supabase] = useState(() => createClient());

    const fetchStats = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const [
                { count: totalUsers, error: totalUsersError },
                { count: pendingProfiles, error: pendingProfilesError },
                { count: approvedProfiles, error: approvedProfilesError },
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
            ]);

            if (totalUsersError || pendingProfilesError || approvedProfilesError) {
                const message = (totalUsersError || pendingProfilesError || approvedProfilesError)?.message || 'Failed to load admin stats.';
                console.error("Stats fetch error:", totalUsersError || pendingProfilesError || approvedProfilesError);
                setErrorMessage(message);
            }

            setStats({
                totalUsers: totalUsers || 0,
                pendingProfiles: pendingProfiles || 0,
                approvedProfiles: approvedProfiles || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin stats.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user ?? null);
        };
        void loadCurrentUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    useEffect(() => {
        void fetchStats();

        const handleVisibilityOrFocus = () => {
            void fetchStats();
        };

        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        };
    }, [supabase]);

    if (loading) {
        return <div className="rounded-[28px] border border-red-100 bg-white p-10 text-center text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">Loading dashboard stats...</div>;
    }

    return (
        <div>
            <div className="mb-8 rounded-[30px] border border-red-100 bg-[linear-gradient(135deg,#fff8f7_0%,#fff_56%,#fff3ed_100%)] p-8 shadow-[0_18px_42px_rgba(227,30,36,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">Admin overview</p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Track profile approvals, monitor account growth, and move between user operations with the same polished brand feel as the public website.</p>
            </div>

            {errorMessage && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {/* Pending Approvals Card */}
                <div className="flex h-full flex-col rounded-[26px] border border-orange-100 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Pending Profiles</p>
                            <p className="mt-2 text-3xl font-bold text-gray-800">{stats.pendingProfiles}</p>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                            <UserPlus className="w-6 h-6 text-orange-500" />
                        </div>
                    </div>
                    <Link
                        href="/admin/users?status=pending"
                        className="mt-auto pt-8 text-sm font-medium text-orange-600 hover:underline"
                    >
                        Review Applications &rarr;
                    </Link>
                </div>

                {/* Total Users Card */}
                <div className="flex h-full flex-col rounded-[26px] border border-blue-100 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Total Users</p>
                            <p className="mt-2 text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <Link
                        href="/admin/users"
                        className="mt-auto pt-8 text-sm font-medium text-blue-600 hover:underline"
                    >
                        View All Users &rarr;
                    </Link>
                </div>

                <div className="flex h-full flex-col rounded-[26px] border border-green-100 bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Approved Profiles</p>
                            <p className="mt-2 text-3xl font-bold text-gray-800">{stats.approvedProfiles}</p>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                    <div className="mt-auto pt-8 text-sm font-medium text-green-600">
                        Approved and visible to users
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] border border-red-100 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <h3 className="mb-4 text-lg font-bold text-gray-800">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <Link href="/admin/users" className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(227,30,36,0.22)] transition hover:bg-red-700">
                        Manage Users
                    </Link>
                    {/* Add more actions */}
                </div>
            </div>

            {/* Debug Info */}
            <div className="mt-8 rounded-[24px] border border-slate-200 bg-white/90 p-5 text-xs text-gray-400 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <div className="flex justify-between items-start">
                    <div>
                        <p>Logged in as: <span className="font-mono text-gray-600 font-bold">{currentUser?.email || 'Not logged in'}</span></p>
                        <p>User ID: <span className="font-mono text-gray-600">{currentUser?.id || 'N/A'}</span></p>
                        <p>Stats Loaded: <span className="font-mono text-gray-600">{errorMessage ? 'With errors' : 'Yes'}</span></p>
                        <p className="mt-2 text-red-400">If email is &quot;Not logged in&quot; but you are on this page, your session is out of sync.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => window.location.reload()}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-gray-600 hover:bg-slate-200"
                        >
                            Hard Refresh
                        </button>
                        <button 
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = '/admin/login';
                            }}
                            className="rounded-xl bg-red-100 px-3 py-2 text-red-600 hover:bg-red-200"
                        >
                            Force Logout
                        </button>
                    </div>
                </div>
                <p className="mt-4 italic">Tip: If you register new users in this same browser, your admin session may be replaced. Please use Incognito mode for testing registrations.</p>
            </div>
        </div>
    );
}
