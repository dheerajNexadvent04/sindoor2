'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Users, UserPlus, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingProfiles: 0,
        approvedProfiles: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [ownerAlertEnabled, setOwnerAlertEnabled] = useState(true);
    const [ownerAlertLoading, setOwnerAlertLoading] = useState(true);
    const [ownerAlertSaving, setOwnerAlertSaving] = useState(false);
    const [ownerAlertError, setOwnerAlertError] = useState<string | null>(null);
    const [ownerAlertNotice, setOwnerAlertNotice] = useState<string | null>(null);
    const [ownerAlertUpdatedAt, setOwnerAlertUpdatedAt] = useState<string | null>(null);
    const [accessDenied, setAccessDenied] = useState(false);

    const [supabase] = useState(() => createClient());
    const router = useRouter();

    const verifyAdminAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setAccessDenied(true);
            return false;
        }

        const { data: adminUser, error: adminError } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

        if (adminError || !adminUser) {
            setAccessDenied(true);
            return false;
        }

        setAccessDenied(false);
        return true;
    };

    const fetchStats = async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'initial') {
            setLoading(true);
        } else {
            setRefreshing(true);
        }
        setErrorMessage(null);
        try {
            const statsPromise = Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
            ]);

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Admin stats request timed out. Please retry.')), 12000);
            });

            const statsResponse = await Promise.race([statsPromise, timeoutPromise]);
            const [
                { count: totalUsers, error: totalUsersError },
                { count: pendingProfiles, error: pendingProfilesError },
                { count: approvedProfiles, error: approvedProfilesError },
            ] = statsResponse;

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
            setRefreshing(false);
        }
    };

    const fetchOwnerAlertSetting = async () => {
        setOwnerAlertLoading(true);
        setOwnerAlertError(null);
        try {
            const response = await fetch('/api/admin/settings/owner-alert', {
                method: 'GET',
                cache: 'no-store',
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to load owner alert setting');
            }

            const enabled = Boolean(result?.settings?.ownerProfileAlertEnabled);
            setOwnerAlertEnabled(enabled);
            setOwnerAlertUpdatedAt(result?.settings?.updatedAt || null);
        } catch (error) {
            console.error('Error loading owner alert setting:', error);
            setOwnerAlertError(error instanceof Error ? error.message : 'Failed to load owner alert setting.');
        } finally {
            setOwnerAlertLoading(false);
        }
    };

    const toggleOwnerAlertSetting = async () => {
        const nextEnabledState = !ownerAlertEnabled;
        setOwnerAlertSaving(true);
        setOwnerAlertError(null);
        setOwnerAlertNotice(null);
        try {
            const response = await fetch('/api/admin/settings/owner-alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled: nextEnabledState }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to update owner alert setting');
            }

            setOwnerAlertEnabled(Boolean(result?.settings?.ownerProfileAlertEnabled));
            setOwnerAlertUpdatedAt(result?.settings?.updatedAt || null);
            setOwnerAlertNotice(result.message || 'Owner alert setting updated.');
        } catch (error) {
            console.error('Error updating owner alert setting:', error);
            setOwnerAlertError(error instanceof Error ? error.message : 'Failed to update owner alert setting.');
        } finally {
            setOwnerAlertSaving(false);
        }
    };

    useEffect(() => {
        const bootstrapAccess = async () => {
            const hasAccess = await verifyAdminAccess();
            if (!hasAccess) {
                setLoading(false);
                setOwnerAlertLoading(false);
            }
        };
        void bootstrapAccess();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
                setAccessDenied(true);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    useEffect(() => {
        const loadDashboard = async () => {
            const hasAccess = await verifyAdminAccess();
            if (!hasAccess) {
                setLoading(false);
                setOwnerAlertLoading(false);
                return;
            }

            await fetchStats('initial');
            await fetchOwnerAlertSetting();
        };

        void loadDashboard();

        const handleVisibilityOrFocus = async () => {
            if (document.visibilityState !== 'visible') return;
            const hasAccess = await verifyAdminAccess();
            if (!hasAccess) {
                setLoading(false);
                setOwnerAlertLoading(false);
                return;
            }
            await fetchStats('refresh');
            await fetchOwnerAlertSetting();
        };

        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        };
    }, [supabase]);

    if (loading) {
        return <div className="rounded-2xl sm:rounded-[28px] border border-red-100 bg-white p-6 sm:p-10 text-center text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">Loading dashboard stats...</div>;
    }

    if (accessDenied) {
        return (
            <div className="rounded-2xl sm:rounded-[28px] border border-red-200 bg-red-50 p-6 sm:p-10 text-center shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <h2 className="text-2xl font-bold text-red-700">Access Denied</h2>
                <p className="mt-3 text-sm text-red-700">You are not authorized to view the admin dashboard.</p>
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        onClick={() => router.push('/admin/login')}
                        className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Go to Admin Login
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="rounded-full border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                        Back to Website
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 sm:mb-8 rounded-2xl sm:rounded-[30px] border border-red-100 bg-[linear-gradient(135deg,#fff8f7_0%,#fff_56%,#fff3ed_100%)] p-4 sm:p-8 shadow-[0_18px_42px_rgba(227,30,36,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">Admin overview</p>
                <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Track profile approvals, monitor account growth, and move between user operations with the same polished brand feel as the public website.</p>
            </div>

            {errorMessage && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            {refreshing && !errorMessage && (
                <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Refreshing latest stats...
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

            <div className="rounded-2xl sm:rounded-[28px] border border-red-100 bg-white p-4 sm:p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <h3 className="mb-4 text-lg font-bold text-gray-800">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <Link href="/admin/users" className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(227,30,36,0.22)] transition hover:bg-red-700">
                        Manage Users
                    </Link>
                    {/* Add more actions */}
                </div>
            </div>

            <div className="mt-6 sm:mt-8 rounded-2xl sm:rounded-[28px] border border-indigo-100 bg-white p-4 sm:p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Automation Control</p>
                        <h3 className="mt-2 text-xl font-bold text-slate-900">Owner New Profile Email Alert</h3>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600">
                            Sends an email to <span className="font-semibold text-slate-800">sindoorsaubhagya@gmail.com</span> whenever a new profile is created.
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                            Status: <span className={ownerAlertEnabled ? 'font-semibold text-green-600' : 'font-semibold text-slate-500'}>{ownerAlertEnabled ? 'Enabled' : 'Disabled'}</span>
                        </p>
                        {ownerAlertUpdatedAt && (
                            <p className="mt-1 text-xs text-slate-500">
                                Last updated: {new Date(ownerAlertUpdatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => void toggleOwnerAlertSetting()}
                        disabled={ownerAlertLoading || ownerAlertSaving}
                        className={`rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition ${ownerAlertEnabled ? 'bg-slate-700 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                        {ownerAlertLoading ? 'Loading...' : ownerAlertSaving ? 'Saving...' : ownerAlertEnabled ? 'Disable Alerts' : 'Enable Alerts'}
                    </button>
                </div>
                {ownerAlertError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {ownerAlertError}
                    </div>
                )}
                {ownerAlertNotice && !ownerAlertError && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {ownerAlertNotice}
                    </div>
                )}
            </div>
        </div>
    );
}
