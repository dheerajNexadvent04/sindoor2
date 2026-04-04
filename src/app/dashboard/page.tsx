"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Users, User, Edit, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './dashboard.module.css';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

interface DashboardProfile {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    photos: string[] | null;
    gender: string | null;
    status?: string | null;
}

interface InterestedProfile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    city: string | null;
    state: string | null;
}

export default function Dashboard() {
    const { user, profile: authProfile, loading, refreshSession } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = React.useState<DashboardProfile | null>(null);
    const [stats, setStats] = React.useState({ views: 0, acceptedInterests: 0, receivedRequests: 0 });
    const [interestedProfiles, setInterestedProfiles] = React.useState<InterestedProfile[]>([]);
    const { signOut } = useAuth(); // Correctly extracting here
    const [authChecked, setAuthChecked] = React.useState(false);

    React.useEffect(() => {
        if (authProfile) {
            setProfile((currentProfile) => ({
                ...(currentProfile ?? {}),
                ...authProfile,
            }));
        }
    }, [authProfile]);

    React.useEffect(() => {
        async function fetchProfileData(userId: string) {
            try {
                const { data: profileData, error: profileErr } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileErr) console.error("Dashboard profile error:", profileErr);
                if (profileData) setProfile(profileData);

                let viewsCount = 0, interestsCount = 0;

                try {
                    const viewsReq = await supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_profile_id', userId);
                    viewsCount = viewsReq.count || 0;
                } catch (e) { console.error("Views fetch error", e); }

                try {
                    const interestsReq = await supabase.from('shortlist').select('id', { count: 'exact', head: true }).eq('shortlisted_profile_id', userId);
                    interestsCount = interestsReq.count || 0;
                } catch (e) { console.error("Interests fetch error", e); }

                setStats({
                    views: viewsCount,
                    acceptedInterests: interestsCount,
                    receivedRequests: interestsCount
                });

                try {
                    const { data: shortlistRows, error: shortlistErr } = await supabase
                        .from('shortlist')
                        .select('user_id')
                        .eq('shortlisted_profile_id', userId)
                        .order('created_at', { ascending: false });

                    if (shortlistErr) throw shortlistErr;

                    const interestedIds = Array.from(new Set((shortlistRows || []).map((row) => row.user_id).filter(Boolean)));

                    if (interestedIds.length > 0) {
                        const { data: interestedRows, error: interestedErr } = await supabase
                            .from('profiles')
                            .select('id, first_name, last_name, photo_url, city, state')
                            .in('id', interestedIds)
                            .limit(6);

                        if (interestedErr) throw interestedErr;
                        setInterestedProfiles((interestedRows as InterestedProfile[]) || []);
                    } else {
                        setInterestedProfiles([]);
                    }
                } catch (e) {
                    console.error("Interested profiles fetch error", e);
                    setInterestedProfiles([]);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        }

        async function bootstrapDashboard() {
            if (user?.id) {
                setAuthChecked(true);
                await fetchProfileData(user.id);
                return;
            }

            if (!loading) {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user?.id) {
                    await refreshSession();
                    setAuthChecked(true);
                    await fetchProfileData(session.user.id);
                    return;
                }

                setAuthChecked(true);
                router.push('/');
            }
        }

        void bootstrapDashboard();
    }, [user?.id, loading, refreshSession, router]);

    React.useEffect(() => {
        const refreshDashboard = async () => {
            if (document.visibilityState === 'hidden') return;

            const userId = user?.id || (await supabase.auth.getSession()).data.session?.user?.id;
            if (!userId) return;

            try {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileData) setProfile(profileData);

                const [{ count: viewsCount }, { count: interestsCount }] = await Promise.all([
                    supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_profile_id', userId),
                    supabase.from('shortlist').select('id', { count: 'exact', head: true }).eq('shortlisted_profile_id', userId),
                ]);

                setStats({
                    views: viewsCount || 0,
                    acceptedInterests: interestsCount || 0,
                    receivedRequests: interestsCount || 0,
                });
            } catch (error) {
                console.error('Dashboard refresh error:', error);
            }
        };

        window.addEventListener('focus', refreshDashboard);
        document.addEventListener('visibilitychange', refreshDashboard);

        return () => {
            window.removeEventListener('focus', refreshDashboard);
            document.removeEventListener('visibilitychange', refreshDashboard);
        };
    }, [user?.id]);

    const resolvedProfile = profile || authProfile;
    const isApprovedProfile = profile?.status === 'approved';
    const displayName = resolvedProfile
        ? `${resolvedProfile.first_name || ''} ${resolvedProfile.last_name || ''}`.trim() || 'Valued Member'
        : user?.email?.split('@')[0] || 'My Account';
    const normalizedStatus = resolvedProfile?.status === 'approved'
        ? 'Approved'
        : resolvedProfile?.status === 'pending'
            ? 'Pending'
            : resolvedProfile?.status
                ? 'Disabled'
                : 'Pending';

    const statusClassName = normalizedStatus === 'Approved'
        ? styles.statusApproved
        : normalizedStatus === 'Pending'
            ? styles.statusPending
            : styles.statusDisabled;

    const handleDeletePhoto = async (photoUrlToDelete: string) => {
        if (!profile?.photos) return;
        if (!confirm("Are you sure you want to delete this photo?")) return;

        try {
            const updatedPhotos = profile.photos.filter((p: string) => p !== photoUrlToDelete);
            const nextPrimaryPhoto = updatedPhotos[0] || null;

            const { error } = await supabase
                .from('profiles')
                .update({ photos: updatedPhotos, photo_url: nextPrimaryPhoto })
                .eq('id', user?.id);

            if (error) throw error;

            // Optimistic update
            setProfile((currentProfile) => currentProfile ? { ...currentProfile, photos: updatedPhotos, photo_url: nextPrimaryPhoto } : currentProfile);
        } catch (error) {
            console.error("Error deleting photo:", error);
            alert("Failed to delete photo. Please try again.");
        }
    };

    // Only block the UI if Auth is actively initializing. Let profile data load asynchronously.
    if (!authChecked && loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fafafa', color: '#333' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Verifying Authentication...</h3>
        </div>
    );
    
    return (
        <>
            {/* Header (User Widget) */}
            <div className={styles.userWidgetRow}>
                <div className={styles.userWidget}>
                    <div className={styles.userImageContainer}>
                        {resolvedProfile?.photo_url || resolvedProfile?.photos?.[0] ? (
                            <Image
                                src={resolvedProfile?.photo_url || resolvedProfile?.photos?.[0] || "/image 1.png"}
                                alt="User"
                                fill
                                className={styles.userImage}
                                unoptimized
                            />
                        ) : (
                            <User size={30} color="#999" />
                        )}
                    </div>
                    <div className={styles.userWidgetInfo}>
                        <span className={styles.userWidgetName}>
                            {displayName}
                        </span>
                        <span className={`${styles.userWidgetRole} ${statusClassName}`}>{normalizedStatus}</span>
                    </div>

                    <div className={styles.userWidgetActions}>
                        <Link href="/dashboard/edit-profile" className={styles.editProfileBtn}>
                            <Edit size={14} />
                        </Link>
                        <button
                            onClick={async () => { await signOut(); window.location.href = '/'; }}
                            className={styles.logoutBtn}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statIconWrapper} style={{ background: '#E3F2FD' }}>
                        <User size={24} color="#2196F3" />
                    </div>
                    <div className={styles.statContent}>
                        <h4>Profile Views</h4>
                        <p>{stats.views}</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIconWrapper} style={{ background: '#FFEBEE' }}>
                        <Heart size={24} color="#E31E24" />
                    </div>
                    <div className={styles.statContent}>
                        <h4>Interests Received</h4>
                        <p>{stats.acceptedInterests}</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIconWrapper} style={{ background: '#E8F5E9' }}>
                        <Users size={24} color="#4CAF50" />
                    </div>
                    <div className={styles.statContent}>
                        <h4>People Interested</h4>
                        <p>{stats.receivedRequests}</p>
                    </div>
                </div>
            </div>

            {/* Photo Gallery */}
            <h3 className={styles.sectionTitle}>My Photos</h3>
            <div className={styles.gallerySection}>
                {profile?.photos && profile.photos.length > 0 ? (
                    <div className={styles.galleryGrid}>
                        {profile.photos.map((photoUrl: string, index: number) => (
                            <div key={index} className={styles.galleryItem}>
                                <Image
                                    src={photoUrl}
                                    alt={`My Photo ${index + 1}`}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                />
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDeletePhoto(photoUrl)}
                                    title="Delete Photo"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyGallery}>
                        <p>No photos uploaded yet. Visit <strong>Edit Profile</strong> to manage your photos.</p>
                    </div>
                )}
            </div>
            {/* People Interested (Blurred) */}
            <h3 className={styles.sectionTitle}>People Interested</h3>
            <div className={`${styles.interestedSection} ${!isApprovedProfile ? styles.interestedSectionLocked : ''}`}>
                {!isApprovedProfile ? (
                    <div className={styles.premiumOverlay}>
                        <h3 className={styles.overlayTitle}>Wait till profile approved</h3>
                        <p className={styles.overlayMessage}>Once admin approves your profile, views and interests from other users will appear here.</p>
                    </div>
                ) : null}

                <div className={`${styles.interestedList} ${isApprovedProfile ? styles.interestedListVisible : ''}`}>
                    {interestedProfiles.length > 0 ? interestedProfiles.map((person) => (
                        <div key={person.id} className={styles.interestedRow}>
                            <div className={styles.interestedPerson}>
                                <div className={styles.interestedAvatar}>
                                    {person.photo_url ? (
                                        <Image src={person.photo_url} alt={person.first_name || 'Profile'} fill className={styles.userImage} unoptimized />
                                    ) : (
                                        <User size={18} color="#999" />
                                    )}
                                </div>
                                <div>
                                    <strong>{`${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member'}</strong>
                                    <span className={styles.interestedMeta}>{[person.city, person.state].filter(Boolean).join(', ') || 'Interested in your profile'}</span>
                                </div>
                            </div>
                            <span className={styles.interestedTag}>Interested</span>
                        </div>
                    )) : (
                        <div className={styles.emptyInterested}>No interests received yet.</div>
                    )}
                </div>
            </div>
        </>
    );
}
