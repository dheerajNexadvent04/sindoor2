"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, User, Edit, X } from 'lucide-react';
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

interface ViewedProfile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    date_of_birth: string | null;
    photo_url: string | null;
    photos: string[] | null;
    viewed_at: string;
}

interface ViewedProfileApiRow {
    viewed_at: string;
    viewed_profile: Omit<ViewedProfile, 'viewed_at'> | null;
}

const getAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age;
};

const formatViewedTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Recently viewed';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function Dashboard() {
    const { user, profile: authProfile, loading, refreshSession, signOut } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = React.useState<DashboardProfile | null>(null);
    const [stats, setStats] = React.useState({ views: 0, interestsReceived: 0, viewedProfiles: 0 });
    const [interestedProfiles, setInterestedProfiles] = React.useState<InterestedProfile[]>([]);
    const [viewedProfiles, setViewedProfiles] = React.useState<ViewedProfile[]>([]);
    const [showViewedProfiles, setShowViewedProfiles] = React.useState(false);
    const [authChecked, setAuthChecked] = React.useState(false);

    React.useEffect(() => {
        if (authProfile) {
            setProfile((currentProfile) => ({
                ...(currentProfile ?? {}),
                ...authProfile,
            }));
        }
    }, [authProfile]);

    const loadViewedProfilesByMe = React.useCallback(async (): Promise<ViewedProfile[]> => {
        try {
            const response = await fetch('/api/views?type=by_me', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error('Unable to load viewed profiles');
            }

            const payload = await response.json();
            const rows = ((payload?.data || []) as ViewedProfileApiRow[]);

            const deduped = new Map<string, ViewedProfile>();
            rows.forEach((row) => {
                const viewedProfile = row.viewed_profile;
                if (!viewedProfile?.id || deduped.has(viewedProfile.id)) return;

                deduped.set(viewedProfile.id, {
                    ...viewedProfile,
                    viewed_at: row.viewed_at,
                });
            });

            return Array.from(deduped.values());
        } catch (error) {
            console.error('Viewed profiles fetch error:', error);
            return [];
        }
    }, []);

    const fetchDashboardData = React.useCallback(async (userId: string) => {
        try {
            const { data: profileData, error: profileErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileErr) {
                console.error("Dashboard profile error:", profileErr);
            }

            if (profileData) {
                setProfile(profileData);
            }

            const [
                viewsReq,
                interestsReq,
                shortlistReq,
                viewedProfilesByMe,
            ] = await Promise.all([
                supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_profile_id', userId),
                supabase.from('shortlist').select('id', { count: 'exact', head: true }).eq('shortlisted_profile_id', userId),
                supabase.from('shortlist').select('user_id').eq('shortlisted_profile_id', userId).order('created_at', { ascending: false }),
                loadViewedProfilesByMe(),
            ]);

            const viewsCount = viewsReq.count || 0;
            const interestsCount = interestsReq.count || 0;

            setViewedProfiles(viewedProfilesByMe);
            setStats({
                views: viewsCount,
                interestsReceived: interestsCount,
                viewedProfiles: viewedProfilesByMe.length,
            });

            if (shortlistReq.error) {
                throw shortlistReq.error;
            }

            const interestedIds = Array.from(
                new Set((shortlistReq.data || []).map((row) => row.user_id).filter(Boolean))
            ) as string[];

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
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setInterestedProfiles([]);
            setViewedProfiles([]);
            setStats((currentStats) => ({
                ...currentStats,
                viewedProfiles: 0,
            }));
        }
    }, [loadViewedProfilesByMe]);

    React.useEffect(() => {
        async function bootstrapDashboard() {
            if (user?.id) {
                setAuthChecked(true);
                await fetchDashboardData(user.id);
                return;
            }

            if (!loading) {
                let restoredUserId: string | null = null;

                for (let attempt = 0; attempt < 3; attempt += 1) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user?.id) {
                        restoredUserId = session.user.id;
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
                }

                if (restoredUserId) {
                    await refreshSession();
                    setAuthChecked(true);
                    await fetchDashboardData(restoredUserId);
                    return;
                }

                setAuthChecked(true);
                router.push('/');
            }
        }

        void bootstrapDashboard();
    }, [user?.id, loading, refreshSession, router, fetchDashboardData]);

    React.useEffect(() => {
        const refreshDashboard = async () => {
            if (document.visibilityState === 'hidden') return;

            const userId = user?.id || (await supabase.auth.getSession()).data.session?.user?.id;
            if (!userId) return;

            await fetchDashboardData(userId);
        };

        window.addEventListener('focus', refreshDashboard);
        document.addEventListener('visibilitychange', refreshDashboard);

        return () => {
            window.removeEventListener('focus', refreshDashboard);
            document.removeEventListener('visibilitychange', refreshDashboard);
        };
    }, [user?.id, fetchDashboardData]);

    const resolvedProfile = profile || authProfile;
    const isApprovedProfile = resolvedProfile?.status === 'approved';
    const displayName = resolvedProfile
        ? `${resolvedProfile.first_name || ''} ${resolvedProfile.last_name || ''}`.trim() || 'Valued Member'
        : user?.email?.split('@')[0] || 'My Account';
    const normalizedStatus = !resolvedProfile
        ? 'Loading...'
        : resolvedProfile.status === 'approved'
            ? 'Approved'
            : resolvedProfile.status === 'pending'
                ? 'Pending'
                : resolvedProfile.status
                    ? 'Disabled'
                    : 'Member';

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
                        <p>{stats.interestsReceived}</p>
                    </div>
                </div>

                <button
                    type="button"
                    className={`${styles.statCard} ${styles.clickableStatCard} ${showViewedProfiles ? styles.statCardActive : ''}`}
                    onClick={() => setShowViewedProfiles((current) => !current)}
                >
                    <div className={styles.statIconWrapper} style={{ background: '#E8F5E9' }}>
                        <Eye size={24} color="#4CAF50" />
                    </div>
                    <div className={styles.statContent}>
                        <h4>Viewed Profiles</h4>
                        <p>{stats.viewedProfiles}</p>
                    </div>
                </button>
            </div>

            {showViewedProfiles && (
                <>
                    <h3 className={styles.sectionTitle}>Viewed Profiles</h3>
                    <div className={styles.viewedProfilesSection}>
                        {viewedProfiles.length > 0 ? (
                            viewedProfiles.map((viewedProfile) => {
                                const profileName = `${viewedProfile.first_name || ''} ${viewedProfile.last_name || ''}`.trim() || 'Member';
                                const age = getAge(viewedProfile.date_of_birth);

                                return (
                                    <div key={`${viewedProfile.id}-${viewedProfile.viewed_at}`} className={styles.interestedRow}>
                                        <div className={styles.interestedPerson}>
                                            <div className={styles.interestedAvatar}>
                                                {viewedProfile.photo_url || viewedProfile.photos?.[0] ? (
                                                    <Image
                                                        src={viewedProfile.photo_url || viewedProfile.photos?.[0] || '/image 1.png'}
                                                        alt={profileName}
                                                        fill
                                                        className={styles.userImage}
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <User size={18} color="#999" />
                                                )}
                                            </div>
                                            <div>
                                                <strong>{profileName}</strong>
                                                <span className={styles.interestedMeta}>
                                                    {age ? `${age} years` : 'Age not shared'} • Viewed on {formatViewedTime(viewedProfile.viewed_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <Link href={`/dashboard/profile/${viewedProfile.id}`} className={styles.viewAgainBtn}>
                                            View Again
                                        </Link>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles.emptyInterested}>You have not viewed any profiles yet.</div>
                        )}
                    </div>
                </>
            )}

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
            {/* Interests Received (Blurred) */}
            <h3 className={styles.sectionTitle}>Interests Received</h3>
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
