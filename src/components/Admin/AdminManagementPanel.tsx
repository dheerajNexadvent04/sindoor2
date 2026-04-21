'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminManagementPanel() {
    const [newAdminEmail, setNewAdminEmail] = React.useState('');
    const [newAdminPassword, setNewAdminPassword] = React.useState('');
    const [newAdminRole, setNewAdminRole] = React.useState<'super_admin' | 'admin' | 'moderator'>('admin');
    const [showPassword, setShowPassword] = React.useState(false);
    const [adminCreateLoading, setAdminCreateLoading] = React.useState(false);
    const [adminCreateError, setAdminCreateError] = React.useState<string | null>(null);
    const [adminCreateNotice, setAdminCreateNotice] = React.useState<string | null>(null);

    const handleCreateAdmin = async (event: React.FormEvent) => {
        event.preventDefault();

        setAdminCreateLoading(true);
        setAdminCreateError(null);
        setAdminCreateNotice(null);

        try {
            const response = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: newAdminEmail.trim(),
                    password: newAdminPassword,
                    role: newAdminRole,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to create admin user');
            }

            setAdminCreateNotice(result.message || 'Admin user created successfully.');
            setNewAdminPassword('');
            setNewAdminEmail('');
            setNewAdminRole('admin');
        } catch (error) {
            console.error('Admin create error:', error);
            setAdminCreateError(error instanceof Error ? error.message : 'Failed to create admin user');
        } finally {
            setAdminCreateLoading(false);
        }
    };

    return (
        <div className="rounded-2xl sm:rounded-[28px] border border-red-100 bg-white p-4 sm:p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Admin Management</p>
            <h3 className="mt-2 text-lg sm:text-xl font-bold text-slate-900">Create / Assign Admin Login</h3>
            <p className="mt-2 text-sm text-slate-600">
                Add a new admin email and password. If the email already exists, password and role will be updated.
            </p>

            <form className="mt-5 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-4" onSubmit={handleCreateAdmin}>
                <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Password (min 8 chars)"
                        minLength={8}
                        required
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-11 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-red-500"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as 'super_admin' | 'admin' | 'moderator')}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                >
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                </select>
                <button
                    type="submit"
                    disabled={adminCreateLoading}
                    className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {adminCreateLoading ? 'Saving...' : 'Create Admin'}
                </button>
            </form>

            {adminCreateError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {adminCreateError}
                </div>
            )}
            {adminCreateNotice && !adminCreateError && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {adminCreateNotice}
                </div>
            )}
        </div>
    );
}
