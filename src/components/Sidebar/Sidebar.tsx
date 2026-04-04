"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Heart, Printer, X } from 'lucide-react';
import styles from './Sidebar.module.css';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
        { name: 'Matches', icon: <Heart size={20} />, path: '/dashboard/matches' },
        { name: 'Print Details', icon: <Printer size={20} />, path: '/dashboard/print-details' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
                onClick={toggleSidebar}
            />

            {/* Sidebar Container */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logoContainer}>
                    <Link href="/">
                        <Image
                            src="/logo 1.png"
                            alt="Sindoor"
                            width={120}
                            height={40}
                            style={{ objectFit: 'contain', cursor: 'pointer' }}
                        />
                    </Link>
                    <button className={styles.closeBtn} onClick={toggleSidebar}>
                        <X size={24} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.sidebarItem} ${isActive ? styles.active : ''}`}
                                onClick={() => {
                                    if (window.innerWidth <= 768) {
                                        toggleSidebar();
                                    }
                                }}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <p>© 2024 Sindoor</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
