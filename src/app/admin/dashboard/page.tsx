'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { Users, UserPlus, Image as ImageIcon, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingProfiles: 0,
        pendingPhotos: 0,
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
                approvedProfiles: approvedProfiles || 0,
                pendingPhotos: 0
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
        return <div className="p-8 text-center text-gray-500">Loading dashboard stats...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

            {errorMessage && (
                <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Pending Approvals Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100 border-l-4 border-l-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-semibold">Pending Profiles</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.pendingProfiles}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-full">
                            <UserPlus className="w-6 h-6 text-orange-500" />
                        </div>
                    </div>
                    <Link
                        href="/admin/users?status=pending"
                        className="text-sm text-orange-600 font-medium mt-4 inline-block hover:underline"
                    >
                        Review Applications &rarr;
                    </Link>
                </div>

                {/* Total Users Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-semibold">Total Users</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalUsers}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <Link
                        href="/admin/users"
                        className="text-sm text-blue-600 font-medium mt-4 inline-block hover:underline"
                    >
                        View All Users &rarr;
                    </Link>
                </div>

                {/* Examples of other cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-semibold">Approved Profiles</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.approvedProfiles}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-semibold">Pending Photos</p>
                            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.pendingPhotos}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-full">
                            <ImageIcon className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                    <span className="text-sm text-gray-400 mt-4 inline-block italic">Coming Soon</span>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                    <Link href="/admin/users" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Manage Users
                    </Link>
                    {/* Add more actions */}
                </div>
            </div>

            {/* Debug Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200 text-xs text-gray-400">
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
                            className="px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                        >
                            Hard Refresh
                        </button>
                        <button 
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = '/admin/login';
                            }}
                            className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
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
