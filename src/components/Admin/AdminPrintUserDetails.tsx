"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Printer, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '@/app/dashboard/print-details/print-details.module.css';

type ProfileData = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    status: string | null;
    profile_for: string | null;
    managed_by: string | null;
    gender: string | null;
    date_of_birth: string | null;
    marital_status: string | null;
    height: number | null;
    weight: number | null;
    mother_tongue: string | null;
    religion_name: string | null;
    caste_name: string | null;
    sub_caste_name: string | null;
    manglik: string | null;
    degree: string | null;
    occupation: string | null;
    employed_in: string | null;
    annual_income: number | null;
    city: string | null;
    state: string | null;
    country: string | null;
    native_city: string | null;
    family_location: string | null;
    family_type: string | null;
    father_occupation: string | null;
    mother_occupation: string | null;
    brothers_total: number | null;
    brothers_married: number | null;
    sisters_total: number | null;
    sisters_married: number | null;
    about_me: string | null;
    about_family: string | null;
    photo_url: string | null;
    photos: string[] | null;
};

const formatValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return 'Not specified';
    return String(value);
};

const formatDate = (value: string | null | undefined) => {
    if (!value) return 'Not specified';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

const formatIncome = (value: number | null | undefined) => {
    if (!value) return 'Not specified';
    return `Rs. ${value.toLocaleString('en-IN')} / year`;
};

const normalizeStatus = (status: string | null | undefined) => {
    if (status === 'approved') return 'Approved';
    if (status === 'pending') return 'Pending';
    if (!status) return 'Pending';
    return 'Disabled';
};

const buildPrintableFileName = (profile: ProfileData, fallbackId: string) => {
    const rawName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    const baseName = rawName || profile.email?.split('@')[0] || fallbackId.slice(0, 8);
    const safeName = baseName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '') || fallbackId.slice(0, 8);

    return `SindhoorSaubhagya_${safeName}`;
};

export default function AdminPrintUserDetails({ userId }: { userId: string }) {
    const [profile, setProfile] = React.useState<ProfileData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadProfile = async () => {
            try {
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (profileError) throw profileError;
                if (!data) throw new Error('Profile data not found.');

                setProfile(data as ProfileData);
            } catch (loadError) {
                console.error('Admin print details load error:', loadError);
                setError('Unable to load printable details right now.');
            } finally {
                setLoading(false);
            }
        };

        void loadProfile();
    }, [userId]);

    const printableFileName = React.useMemo(() => {
        if (!profile) return 'SindhoorSaubhagya_profile';
        return buildPrintableFileName(profile, userId);
    }, [profile, userId]);

    React.useEffect(() => {
        if (!profile) return;

        const previousTitle = document.title;
        document.title = printableFileName;

        return () => {
            document.title = previousTitle;
        };
    }, [profile, printableFileName]);

    const handlePrint = () => {
        if (!profile) return;

        const previousTitle = document.title;
        const restoreTitle = () => {
            document.title = previousTitle;
            window.removeEventListener('afterprint', restoreTitle);
        };

        window.addEventListener('afterprint', restoreTitle);
        document.title = printableFileName;
        window.print();
        window.setTimeout(restoreTitle, 1500);
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingCard}>Preparing printable profile...</div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className={styles.page}>
                <div className={styles.errorCard}>{error || 'Unable to load profile.'}</div>
            </div>
        );
    }

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Member Profile';
    const primaryPhoto = profile.photo_url || profile.photos?.[0] || null;
    const statusLabel = normalizeStatus(profile.status);

    return (
        <div className={styles.page}>
            <div className={styles.toolbar}>
                <h1 className={styles.pageTitle}>Admin Print Details</h1>
                <div className={styles.toolbarActions}>
                    <Link
                        href={`/admin/users/${userId}`}
                        className={styles.printButton}
                        style={{ background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', boxShadow: '0 12px 22px rgba(15, 23, 42, 0.22)' }}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Link>
                    <button type="button" className={styles.printButton} onClick={handlePrint}>
                        <Printer size={16} />
                        Print / Download
                    </button>
                </div>
            </div>

            <article className={styles.previewSheet}>
                <header className={styles.sheetHeader}>
                    <div className={styles.brandBlock}>
                        <Image
                            src="/logo 1.png"
                            alt="Sindoor Saubhagya"
                            width={170}
                            height={58}
                            className={styles.logo}
                            priority
                        />
                    </div>
                    <div className={styles.headerSummary}>
                        <div className={styles.headerMeta}>
                            <h2>{fullName}</h2>
                            <p>Status: {statusLabel}</p>
                        </div>
                        <div className={styles.photoFrame}>
                            {primaryPhoto ? (
                                <Image src={primaryPhoto} alt={fullName} fill className={styles.photo} unoptimized />
                            ) : (
                                <div className={styles.photoFallback}>
                                    <User size={44} />
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <section className={styles.section}>
                    <h3>Basic Information</h3>
                    <div className={styles.grid}>
                        <p><span>First Name</span>{formatValue(profile.first_name)}</p>
                        <p><span>Last Name</span>{formatValue(profile.last_name)}</p>
                        <p className={styles.hideInPrint}><span>Email</span>{formatValue(profile.email)}</p>
                        <p className={styles.hideInPrint}><span>Phone</span>{formatValue(profile.phone)}</p>
                        <p><span>Profile For</span>{formatValue(profile.profile_for)}</p>
                        <p><span>Managed By</span>{formatValue(profile.managed_by)}</p>
                        <p><span>Gender</span>{formatValue(profile.gender)}</p>
                        <p><span>Date of Birth</span>{formatDate(profile.date_of_birth)}</p>
                        <p><span>Marital Status</span>{formatValue(profile.marital_status)}</p>
                        <p><span>Height</span>{profile.height ? `${profile.height} cm` : 'Not specified'}</p>
                        <p><span>Weight</span>{profile.weight ? `${profile.weight} kg` : 'Not specified'}</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3>Religion & Community</h3>
                    <div className={styles.grid}>
                        <p><span>Religion</span>{formatValue(profile.religion_name)}</p>
                        <p><span>Caste</span>{formatValue(profile.caste_name)}</p>
                        <p><span>Sub Caste</span>{formatValue(profile.sub_caste_name)}</p>
                        <p><span>Mother Tongue</span>{formatValue(profile.mother_tongue)}</p>
                        <p><span>Manglik</span>{formatValue(profile.manglik)}</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3>Education & Career</h3>
                    <div className={styles.grid}>
                        <p><span>Degree</span>{formatValue(profile.degree)}</p>
                        <p><span>Occupation</span>{formatValue(profile.occupation)}</p>
                        <p><span>Employed In</span>{formatValue(profile.employed_in)}</p>
                        <p><span>Annual Income</span>{formatIncome(profile.annual_income)}</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3>Location</h3>
                    <div className={styles.grid}>
                        <p><span>City</span>{formatValue(profile.city)}</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3>Family Details</h3>
                    <div className={styles.grid}>
                        <p><span>Family Type</span>{formatValue(profile.family_type)}</p>
                        <p><span>Father Occupation</span>{formatValue(profile.father_occupation)}</p>
                        <p><span>Mother Occupation</span>{formatValue(profile.mother_occupation)}</p>
                        <p><span>Brothers</span>{formatValue(profile.brothers_total)}</p>
                        <p><span>Brothers Married</span>{formatValue(profile.brothers_married)}</p>
                        <p><span>Sisters</span>{formatValue(profile.sisters_total)}</p>
                        <p><span>Sisters Married</span>{formatValue(profile.sisters_married)}</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h3>About</h3>
                    <div className={styles.textBlock}>
                        <p><span>About Me</span>{formatValue(profile.about_me)}</p>
                        <p><span>About Family</span>{formatValue(profile.about_family)}</p>
                    </div>
                </section>
            </article>
        </div>
    );
}
