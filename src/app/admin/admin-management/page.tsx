'use client';

import AdminManagementPanel from '@/components/Admin/AdminManagementPanel';

export default function AdminManagementPage() {
    return (
        <div>
            <div className="mb-6 sm:mb-8 rounded-2xl sm:rounded-[30px] border border-red-100 bg-[linear-gradient(135deg,#fff8f7_0%,#fff_56%,#fff3ed_100%)] p-4 sm:p-8 shadow-[0_18px_42px_rgba(227,30,36,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">Admin tools</p>
                <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">Admin Management</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Create or update admin login credentials and assign roles for dashboard access.
                </p>
            </div>

            <AdminManagementPanel />
        </div>
    );
}

