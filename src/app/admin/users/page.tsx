'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Check, X } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

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

export default function UserManagement() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved
    const [search, setSearch] = useState('');
    const supabase = createClient();
    const searchParams = useSearchParams();

    const fetchUsers = async () => {
        setLoading(true);

        // Debug Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log("Admin Dashboard - Current User:", user?.id, "Auth Error:", authError);

        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;

        console.log("Admin Dashboard - Profiles Data:", data?.length, "Error:", error);

        if (error) {
            console.error('Error fetching users:', error);
            // alert('Error fetching users: ' + error.message); // Optional: show to user
        } else {
            setUsers(data as UserProfile[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        const statusFromQuery = searchParams.get('status');
        if (statusFromQuery === 'pending' || statusFromQuery === 'approved' || statusFromQuery === 'all') {
            setFilter(statusFromQuery);
        }
    }, [searchParams]);

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
        <div>
            <div className="mb-8 rounded-[30px] border border-red-100 bg-[linear-gradient(135deg,#fff8f7_0%,#fff_56%,#fff4ef_100%)] p-8 shadow-[0_18px_42px_rgba(227,30,36,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">Profiles</p>
                <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Review profile quality, move applications across approval states, and open individual records for deeper edits.</p>
                    </div>
                    <div className="flex gap-2">
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

            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                {/* Search Bar */}
                <div className="flex items-center gap-2 border-b border-red-50 bg-[#fffaf9] p-5">
                    <Search className="text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="flex-1 border-none outline-none text-gray-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
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
                                            <a href={`/admin/users/${user.id}`} className="block group">
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
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize
                            ${user.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    user.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-red-100 text-red-800'}`}>
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
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
