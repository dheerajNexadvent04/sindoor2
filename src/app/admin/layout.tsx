'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [supabase] = React.useState(() => createClient());
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
        router.refresh();
    };

    const navItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'User Management', href: '/admin/users', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f7_0%,#fffdfb_38%,#f7f8fb_100%)] flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-red-100/70 bg-[linear-gradient(180deg,#fff7f6_0%,#fff_34%,#fff4f2_100%)] text-slate-800 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:relative lg:translate-x-0 flex flex-col shadow-[0_18px_60px_rgba(227,30,36,0.08)]`}
            >
                <div className="border-b border-red-100/80 px-6 py-6">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center">
                            <Image
                                src="/logo 1.png"
                                alt="Sindoor Saubhagya"
                                width={92}
                                height={64}
                                className="h-auto w-auto object-contain"
                                priority
                            />
                        </div>
                        <button
                            className="lg:hidden text-slate-400 hover:text-slate-700"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center rounded-2xl px-4 py-3.5 text-sm font-medium transition-all ${isActive
                                        ? 'bg-red-600 text-white shadow-[0_18px_30px_rgba(227,30,36,0.22)]'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-[0_14px_28px_rgba(15,23,42,0.06)]'
                                    }`}
                            >
                                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-red-500 group-hover:text-red-600'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto border-t border-red-100/80 p-4">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex h-16 items-center bg-white/90 px-4 shadow-sm backdrop-blur">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="ml-4 flex items-center">
                        <Image
                            src="/logo 1.png"
                            alt="Sindoor Saubhagya"
                            width={76}
                            height={42}
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
