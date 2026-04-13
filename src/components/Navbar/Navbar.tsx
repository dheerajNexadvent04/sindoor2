"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, User } from 'lucide-react';
import styles from './Navbar.module.css';
import { useModal } from '@/context/ModalContext';
import { useAuth } from '@/context/AuthProvider';
import { usePathname } from 'next/navigation';

const Navbar = () => {
    const { openLogin } = useModal();
    const { session, user, profile, profileChecked } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isStickyOnHome, setIsStickyOnHome] = useState(false);
    const [navbarHeight, setNavbarHeight] = useState(0);
    const navRef = useRef<HTMLElement | null>(null);
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const isAuthenticated = Boolean((session?.user || user) && (!profileChecked || profile?.id));

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        if (!isHomePage) return;

        const onScroll = () => {
            setIsStickyOnHome(window.scrollY > 40);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isHomePage]);

    useEffect(() => {
        const updateHeight = () => {
            setNavbarHeight(navRef.current?.offsetHeight || 0);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [isStickyOnHome]);

    // Hide Navbar on Admin and Dashboard pages
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) {
        return null;
    }

    const displayName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : ((session?.user?.email || user?.email)?.split('@')[0] || 'My Account');
    const primaryPhoto = profile?.photo_url || profile?.photos?.[0] || null;

    const normalizedStatus = profile?.status === 'approved'
        ? 'Approved'
        : profile?.status === 'pending'
            ? 'Pending'
            : profile?.status
                ? 'Disabled'
                : 'Pending';

    const statusClassName = normalizedStatus === 'Approved'
        ? styles.statusApproved
        : normalizedStatus === 'Pending'
            ? styles.statusPending
            : styles.statusDisabled;
    const announcementItems = [
        '100% verified profiles',
        "India's one of the best online matchmaking website",
        'Trusted by more than 50 couples',
        'Get in touch today',
        'Find matches as per your requirements',
    ];
    const renderMarqueeLine = (keyPrefix: string) => (
        <span className={styles.announcementLine}>
            {announcementItems.map((item, index) => (
                <span key={`${keyPrefix}-${item}-${index}`} className={styles.announcementItem}>
                    {item}
                    {index < announcementItems.length - 1 && (
                        <span className={styles.announcementSeparator} aria-hidden="true">
                            |
                        </span>
                    )}
                </span>
            ))}
        </span>
    );

    return (
        <>
            {isHomePage && isStickyOnHome && navbarHeight > 0 && (
                <div style={{ height: `${navbarHeight}px` }} aria-hidden="true" />
            )}
            <nav
                ref={navRef}
                className={`${styles.navbarContainer} ${isHomePage && isStickyOnHome ? styles.navbarStickyHome : ''}`}
            >
                <div className={styles.topBar}>
                    <div className={styles.topBarTrack}>
                        {renderMarqueeLine('a')}
                        <span aria-hidden="true">{renderMarqueeLine('b')}</span>
                    </div>
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
                        {isAuthenticated && <Link href="/profile" className={styles.navLink}>View Profile</Link>}
                        <Link href="/contact" className={styles.navLink}>Contact Us</Link>
                    </div>

                    {/* Desktop Auth Buttons / User Profile */}
                    <div className={styles.authButtons}>
                        {isAuthenticated ? (
                            <Link href="/dashboard" className={styles.accountBadge}>
                                <div className={styles.userImageContainer}>
                                    {primaryPhoto ? (
                                        <Image
                                            src={primaryPhoto}
                                            alt="User"
                                            fill
                                            className={styles.userImage}
                                            unoptimized
                                        />
                                    ) : (
                                        <User size={22} color="#999" />
                                    )}
                                </div>
                                <div className={styles.userWidgetInfo}>
                                    <span className={styles.userWidgetName}>{displayName || 'My Account'}</span>
                                    <span className={`${styles.statusBadge} ${statusClassName}`}>{normalizedStatus}</span>
                                </div>
                            </Link>
                        ) : (
                            <>
                                <button className={styles.btnLogin} onClick={openLogin}>Login</button>
                                <Link href="/register" className={styles.btnContact}>Register</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-expanded={isMobileMenuOpen}>
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
                <div
                    className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.open : ''}`}
                    onClick={toggleMobileMenu}
                ></div>

                <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
                    <div className={styles.mobileCloseHeader}>
                        <Link href="/" onClick={toggleMobileMenu}>
                            <Image
                                src="/logo 1.png"
                                alt="Sindoor"
                                width={120}
                                height={40}
                                style={{ objectFit: 'contain' }}
                            />
                        </Link>
                        <button onClick={toggleMobileMenu} className={styles.mobileCloseBtn}>
                            <X size={28} />
                        </button>
                    </div>

                    <div className={styles.mobileLinks}>
                        <Link href="/" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Home</Link>
                        <Link href="/membership" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Membership</Link>
                        <Link href="/about" className={styles.mobileNavLink} onClick={toggleMobileMenu}>About Us</Link>
                        {isAuthenticated && <Link href="/profile" className={styles.mobileNavLink} onClick={toggleMobileMenu}>View Profile</Link>}
                        <Link href="/contact" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Contact Us</Link>
                    </div>

                    <div className={styles.mobileAuthButtons}>
                        {isAuthenticated ? (
                            <Link href="/dashboard" className={styles.accountBadge} onClick={toggleMobileMenu}>
                                <div className={styles.userImageContainer}>
                                    {primaryPhoto ? (
                                        <Image
                                            src={primaryPhoto}
                                            alt="User"
                                            fill
                                            className={styles.userImage}
                                            unoptimized
                                        />
                                    ) : (
                                        <User size={22} color="#999" />
                                    )}
                                </div>
                                <div className={styles.userWidgetInfo}>
                                    <span className={styles.userWidgetName}>{displayName || 'My Account'}</span>
                                    <span className={`${styles.statusBadge} ${statusClassName}`}>{normalizedStatus}</span>
                                </div>
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
