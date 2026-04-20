"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, User } from 'lucide-react';
import styles from './Navbar.module.css';
import { useModal } from '@/context/ModalContext';
import { useAuth } from '@/context/AuthProvider';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const Navbar = () => {
    const { openLogin } = useModal();
    const { user, profile, loading: authLoading, signOut, refreshSession } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const handleLogout = async () => {
        console.log("Navbar: Logging out...");
        await signOut();
        window.location.href = '/';
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Fix for "stale logout" bug when using browser back button or Next.js router cache
    useEffect(() => {
        if (!authLoading && !user) {
            const checkSession = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    console.log("Navbar: Stale auth state detected (Found session without user context). Forcing refresh.");
                    refreshSession();
                }
            };
            checkSession();
        }
    }, [pathname, authLoading, user, refreshSession]);

    return (
        <>
            <nav className={styles.navbarContainer}>
                <div className={styles.topBar}>
                    50% OFF ON MEMBERSHIP PLANS
                </div>

                <div className={styles.mainNav}>
                    <div className={styles.logoContainer}>
                        <Link href="/">
                            <Image
                                src="/logo 1.png"
                                alt="Sindoor Saubhagya"
                                width={150}
                                height={50}
                                className={styles.logo}
                                priority
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className={styles.navLinks}>
                        <Link href="/" className={styles.navLink}>Home</Link>
                        <Link href="/membership" className={styles.navLink}>Membership</Link>
                        <Link href="/about" className={styles.navLink}>About Us</Link>
                        {user && <Link href="/profile" className={styles.navLink}>View Profile</Link>}
                    </div>

                    {/* Desktop Auth Buttons / User Profile */}
                    <div className={styles.authButtons}>
                        {authLoading ? (
                            <div className={styles.authPlaceholder}></div>
                        ) : user ? (
                            <Link href="/dashboard" className={styles.userWidget}>
                                <div className={styles.userImageContainer}>
                                    {profile?.photo_url || profile?.photos?.[0] ? (
                                        <Image
                                            src={profile?.photo_url || profile?.photos?.[0] || "/image 1.png"}
                                            alt="User"
                                            fill
                                            className={styles.userImage}
                                            unoptimized
                                        />
                                    ) : (
                                        <User size={20} color="#999" />
                                    )}
                                </div>
                                <div className={styles.userWidgetInfo}>
                                    <span className={styles.userWidgetName}>
                                        {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : (user.email?.split('@')[0] || 'My Account')}
                                    </span>
                                    <span className={styles.userWidgetRole}>{profile?.is_premium ? 'Premium' : 'Free Member'}</span>
                                </div>
                                <button className={styles.btnLogoutSmall} onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                                    Logout
                                </button>
                            </Link>
                        ) : (
                            <>
                                <button className={styles.btnLogin} onClick={openLogin}>Login</button>
                                <Link href="/register" className={styles.btnContact}>Register</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu}>
                        {isMobileMenuOpen ? (
                            <X size={28} />
                        ) : (
                            <Image
                                src="/Frame.png"
                                alt="Menu"
                                width={28}
                                height={28}
                                style={{ objectFit: 'contain' }}
                            />
                        )}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className={styles.mobileMenuOverlay} onClick={toggleMobileMenu}></div>
                )}

                <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
                    <div className={styles.mobileCloseHeader}>
                        <Image
                            src="/logo 1.png"
                            alt="Sindoor"
                            width={120}
                            height={40}
                            style={{ objectFit: 'contain' }}
                        />
                        <button onClick={toggleMobileMenu} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}>
                            <X size={28} />
                        </button>
                    </div>

                    <div className={styles.mobileLinks}>
                        <Link href="/" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Home</Link>
                        <Link href="/membership" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Membership</Link>
                        <Link href="/about" className={styles.mobileNavLink} onClick={toggleMobileMenu}>About Us</Link>
                        {user && <Link href="/profile" className={styles.mobileNavLink} onClick={toggleMobileMenu}>View Profile</Link>}
                    </div>

                    <div className={styles.mobileAuthButtons}>
                        {authLoading ? null : user ? (
                            <Link href="/dashboard" className={styles.userWidget} onClick={toggleMobileMenu}>
                                <div className={styles.userImageContainer}>
                                    {profile?.photo_url || profile?.photos?.[0] ? (
                                        <Image
                                            src={profile?.photo_url || profile?.photos?.[0] || "/image 1.png"}
                                            alt="User"
                                            fill
                                            className={styles.userImage}
                                            unoptimized
                                        />
                                    ) : (
                                        <User size={20} color="#999" />
                                    )}
                                </div>
                                <div className={styles.userWidgetInfo}>
                                    <span className={styles.userWidgetName}>
                                        {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : (user.email?.split('@')[0] || 'My Account')}
                                    </span>
                                    <span className={styles.userWidgetRole}>{profile?.is_premium ? 'Premium' : 'Free Member'}</span>
                                </div>
                                <button className={styles.btnLogoutSmall} onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                                    Logout
                                </button>
                            </Link>
                        ) : (
                            <>
                                <button className={styles.btnLogin} onClick={() => { openLogin(); toggleMobileMenu(); }}>Login</button>
                                <Link href="/register" className={styles.btnContact} onClick={toggleMobileMenu}>Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
