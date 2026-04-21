'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Check, X, Printer } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type UserProfile = {
    id: string;
    first_name: string;
    last_name: string;
    email: string; // From join or meta? Profile doesn't have email usually, but let's see schema. 
    // Schema says profiles has email column in handle_new_user trigger, so yes.
    photo_url: string;
    gender: string;
    status: 'pending' | 'approved' | 'rejected' | 'deactivated';
    created_at: string;
};

type UserStatus = UserProfile['status'];

const getStatusClasses = (status: UserStatus) => {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'pending') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
};

export default function UserManagement() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved
    const [search, setSearch] = useState('');
    const supabase = createClient();

    const fetchUsers = async () => {
        setLoading(true);

        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching users:', error);
            // alert('Error fetching users: ' + error.message); // Optional: show to user
        } else {
            setUsers(data as UserProfile[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const searchParams = new URLSearchParams(window.location.search);
        const statusFromQuery = searchParams.get('status');
        if (statusFromQuery === 'pending' || statusFromQuery === 'approved' || statusFromQuery === 'all') {
            setFilter(statusFromQuery);
        }
    }, []);

    useEffect(() => {
        void fetchUsers();
    }, [filter]);

    const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
        if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', userId);

            if (error) throw error;

            // Optimistic update
            setUsers((currentUsers) => currentUsers.map((u) => u.id === userId ? { ...u, status: newStatus } : u));
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update status');
        }
    };

    const filteredUsers = users.filter(user =>
        search === '' ||
        (user.first_name + ' ' + user.last_name).toLowerCase().includes(search.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="overflow-x-hidden">
            <div className="mb-6 rounded-2xl border border-red-100 bg-[linear-gradient(135deg,#fff8f7_0%,#fff_56%,#fff4ef_100%)] p-4 shadow-[0_18px_42px_rgba(227,30,36,0.08)] md:mb-8 md:rounded-[30px] md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">Profiles</p>
                <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 md:text-3xl">User Management</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Review profile quality, move applications across approval states, and open individual records for deeper edits.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === 'all' ? 'bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === 'pending' ? 'bg-orange-500 text-white shadow-[0_14px_30px_rgba(249,115,22,0.22)]' : 'bg-white text-orange-600 border border-orange-200 hover:border-orange-300'}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === 'approved' ? 'bg-green-500 text-white shadow-[0_14px_30px_rgba(34,197,94,0.22)]' : 'bg-white text-green-600 border border-green-200 hover:border-green-300'}`}
                        >
                            Approved
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl md:rounded-[28px] border border-red-100 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                {/* Search Bar */}
                <div className="flex items-center gap-2 border-b border-red-50 bg-[#fffaf9] p-4 md:p-5">
                    <Search className="text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="flex-1 border-none outline-none text-gray-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-[#fff7f5] text-gray-800 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-8 text-center">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="transition-colors hover:bg-[#fffaf9]">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/users/${user.id}`} className="block group">
                                                <div className="flex items-center gap-3 group-hover:opacity-80 transition-opacity">
                                                    <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-red-100">
                                                        {user.photo_url ? (
                                                            <Image src={user.photo_url} alt="User" fill className="object-cover" unoptimized />
                                                        ) : (
                                                            <span className="flex items-center justify-center h-full text-xs text-gray-500">N/A</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">{user.first_name} {user.last_name}</p>
                                                        <p className="text-xs text-gray-400">{user.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Approve Button */}
                                                {user.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleStatusChange(user.id, 'approved')}
                                                        className="rounded-xl bg-green-50 p-2 text-green-600 hover:bg-green-100" title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {/* Reject Button */}
                                                {user.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => handleStatusChange(user.id, 'rejected')}
                                                        className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100" title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/users/${user.id}/print`}
                                                    className="rounded-xl bg-slate-50 p-2 text-slate-700 hover:bg-slate-100"
                                                    title="Print details"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden px-2.5 py-3 space-y-3">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">No users found.</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                                <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-red-100">
                                        {user.photo_url ? (
                                            <Image src={user.photo_url} alt="User" fill className="object-cover" unoptimized />
                                        ) : (
                                            <span className="flex items-center justify-center h-full text-xs text-gray-500">N/A</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-slate-900 truncate">{user.first_name} {user.last_name}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.email || 'No email'}</p>
                                        <p className="mt-1 text-[11px] text-slate-400">{new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                </Link>

                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(user.status)}`}>
                                        {user.status}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {user.status !== 'approved' && (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'approved')}
                                                className="rounded-xl bg-green-50 p-2 text-green-600 hover:bg-green-100"
                                                title="Approve"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        {user.status !== 'rejected' && (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'rejected')}
                                                className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"
                                                title="Reject"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        <Link
                                            href={`/admin/users/${user.id}/print`}
                                            className="rounded-xl bg-slate-50 p-2 text-slate-700 hover:bg-slate-100"
                                            title="Print details"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
