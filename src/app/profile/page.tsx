"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Filter, MapPin, Ruler, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import styles from './profile.module.css';

type PreferencesForm = {
    preferred_gender: string;
    age_min: string;
    age_max: string;
    height_min: string;
    height_max: string;
    marital_status: string;
    religion_name: string;
    caste_name: string;
    mother_tongue: string;
    manglik: string;
    degree: string;
    employed_in: string;
    occupation_keyword: string;
    annual_income_min: string;
    country: string;
    state: string;
    city: string;
};

type UserProfile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    status: string | null;
    partner_preferences: Partial<PreferencesForm> | null;
};

type SuggestedProfile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    date_of_birth: string | null;
    height: number | null;
    religion_name: string | null;
    caste_name: string | null;
    city: string | null;
    state: string | null;
    photo_url: string | null;
    photos: string[] | null;
    occupation: string | null;
    degree: string | null;
};

type RankedProfile = SuggestedProfile & { score: number };

type LiveFilters = {
    ageMin: string;
    ageMax: string;
    city: string;
    heightMin: string;
    caste: string;
};

const ageOptions = Array.from({ length: 23 }, (_, index) => `${index + 21}`);
const heightOptions = Array.from({ length: 41 }, (_, index) => `${145 + index}`);

const getDefaultPreferences = (gender?: string | null): PreferencesForm => ({
    preferred_gender: gender === 'male' ? 'female' : gender === 'female' ? 'male' : '',
    age_min: '23',
    age_max: '30',
    height_min: '',
    height_max: '',
    marital_status: '',
    religion_name: '',
    caste_name: '',
    mother_tongue: '',
    manglik: '',
    degree: '',
    employed_in: '',
    occupation_keyword: '',
    annual_income_min: '',
    country: 'India',
    state: '',
    city: '',
});

const normalizePreferences = (savedPreferences: Partial<PreferencesForm> | null | undefined, gender?: string | null): PreferencesForm => ({
    ...getDefaultPreferences(gender),
    ...(savedPreferences || {}),
});

const hasConfiguredPreferences = (savedPreferences: Partial<PreferencesForm> | null | undefined) =>
    Boolean(savedPreferences && Object.entries(savedPreferences).some(([, value]) => typeof value === 'string' && value.trim() !== ''));

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

const scoreProfile = (candidate: SuggestedProfile, preferences: PreferencesForm) => {
    let score = 20;
    const candidateAge = getAge(candidate.date_of_birth);
    const ageMin = preferences.age_min ? parseInt(preferences.age_min, 10) : null;
    const ageMax = preferences.age_max ? parseInt(preferences.age_max, 10) : null;
    const heightMin = preferences.height_min ? parseInt(preferences.height_min, 10) : null;
    const heightMax = preferences.height_max ? parseInt(preferences.height_max, 10) : null;

    if (ageMin !== null && candidateAge !== null) score += candidateAge >= ageMin ? 10 : -8;
    if (ageMax !== null && candidateAge !== null) score += candidateAge <= ageMax ? 10 : -8;
    if (heightMin !== null && candidate.height !== null) score += candidate.height >= heightMin ? 6 : -4;
    if (heightMax !== null && candidate.height !== null) score += candidate.height <= heightMax ? 6 : -4;
    if (preferences.religion_name && candidate.religion_name === preferences.religion_name) score += 12;
    if (preferences.caste_name && candidate.caste_name?.toLowerCase() === preferences.caste_name.toLowerCase()) score += 10;
    if (preferences.city && candidate.city?.toLowerCase() === preferences.city.toLowerCase()) score += 9;
    if (candidate.photo_url || candidate.photos?.[0]) score += 4;
    return score;
};

export default function ProfileGalleryPage() {
    const { user, loading: authLoading, refreshSession } = useAuth();
    const headerCardRef = React.useRef<HTMLElement | null>(null);
    const [profile, setProfile] = React.useState<UserProfile | null>(null);
    const [matches, setMatches] = React.useState<RankedProfile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showFilters, setShowFilters] = React.useState(false);
    const [showStickyFilter, setShowStickyFilter] = React.useState(false);
    const [filters, setFilters] = React.useState<LiveFilters>({
        ageMin: '',
        ageMax: '',
        city: '',
        heightMin: '',
        caste: '',
    });

    const loadProfiles = React.useCallback(async (userId: string) => {
        setLoading(true);
        try {
            const { data: currentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, gender, status, partner_preferences')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            const typedProfile = currentProfile as UserProfile;
            setProfile(typedProfile);

            const preferences = normalizePreferences(typedProfile.partner_preferences, typedProfile.gender);

            if (typedProfile.status !== 'approved' || !hasConfiguredPreferences(typedProfile.partner_preferences)) {
                setMatches([]);
                setFilters({
                    ageMin: preferences.age_min || '',
                    ageMax: preferences.age_max || '',
                    city: preferences.city || '',
                    heightMin: preferences.height_min || '',
                    caste: preferences.caste_name || '',
                });
                return;
            }

            let query = supabase
                .from('profiles')
                .select('id, first_name, last_name, gender, date_of_birth, height, religion_name, caste_name, city, state, photo_url, photos, occupation, degree')
                .eq('status', 'approved')
                .neq('id', typedProfile.id)
                .limit(40);

            if (preferences.preferred_gender) {
                query = query.eq('gender', preferences.preferred_gender);
            }

            const { data: candidates, error: candidateError } = await query;
            if (candidateError) throw candidateError;

            const rankedMatches = (((candidates as SuggestedProfile[] | null) || []).map((candidate) => ({
                ...candidate,
                score: Math.max(1, Math.min(99, scoreProfile(candidate, preferences))),
            }))).sort((a, b) => b.score - a.score);

            setMatches(rankedMatches);
            setFilters({
                ageMin: preferences.age_min || '',
                ageMax: preferences.age_max || '',
                city: preferences.city || '',
                heightMin: preferences.height_min || '',
                caste: preferences.caste_name || '',
            });
        } catch (error) {
            console.error('Profile gallery load error:', error);
            setMatches([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const bootstrap = async () => {
            if (authLoading) return;
            if (user?.id) {
                await loadProfiles(user.id);
                return;
            }
            await refreshSession();
            setLoading(false);
        };

        void bootstrap();
    }, [authLoading, user?.id, refreshSession, loadProfiles]);

    React.useEffect(() => {
        const headerCardElement = headerCardRef.current;
        if (!headerCardElement) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowStickyFilter(!entry.isIntersecting);
            },
            {
                threshold: 0.2,
            }
        );

        observer.observe(headerCardElement);
        return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
        if (!showFilters) return;

        const previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousBodyOverflow;
        };
    }, [showFilters]);

    const filteredMatches = matches.filter((match) => {
        const age = getAge(match.date_of_birth);
        const minAge = filters.ageMin ? parseInt(filters.ageMin, 10) : null;
        const maxAge = filters.ageMax ? parseInt(filters.ageMax, 10) : null;
        const minHeight = filters.heightMin ? parseInt(filters.heightMin, 10) : null;
        const cityQuery = filters.city.trim().toLowerCase();
        const casteQuery = filters.caste.trim().toLowerCase();

        if (minAge !== null && age !== null && age < minAge) return false;
        if (maxAge !== null && age !== null && age > maxAge) return false;
        if (minHeight !== null && match.height !== null && match.height < minHeight) return false;
        if (cityQuery && !(match.city || '').toLowerCase().includes(cityQuery)) return false;
        if (casteQuery && !(match.caste_name || '').toLowerCase().includes(casteQuery)) return false;
        return true;
    });

    const handleFilterChange = (field: keyof LiveFilters, value: string) => {
        setFilters((current) => ({ ...current, [field]: value }));
    };

    const filtersDisabled = profile?.status !== 'approved' || matches.length === 0;
    const pendingProfile = profile?.status !== 'approved';
    const shouldShowStickyFilterButton = showStickyFilter && !showFilters;

    return (
        <div className={styles.page}>
            <section ref={headerCardRef} className={styles.headerCard}>
                <div>
                    <p className={styles.eyebrow}>Your Matches</p>
                    <h1 className={styles.title}>View Profiles</h1>
                    <p className={styles.subtitle}>Browse the same best-match suggestions from your dashboard in a cleaner gallery view with quick live filters.</p>
                </div>

                <button
                    type="button"
                    className={styles.filterToggle}
                    onClick={() => setShowFilters((current) => !current)}
                >
                    <Filter size={16} />
                    Filter
                    <ChevronDown size={16} className={showFilters ? styles.chevronOpen : ''} />
                </button>
            </section>

            <button
                type="button"
                className={`${styles.floatingFilterToggle} ${shouldShowStickyFilterButton ? styles.floatingFilterVisible : ''}`}
                onClick={() => setShowFilters(true)}
            >
                <Filter size={16} />
                Filter
                <ChevronDown size={16} />
            </button>

            <section className={styles.contentShell}>
                <div className={styles.gridShell}>
                    <div className={styles.gridHeader}>
                        <span>Your Matches</span>
                        <span className={styles.matchCount}>{filteredMatches.length} profiles</span>
                    </div>

                    {loading ? (
                        <div className={styles.cardGrid}>
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className={styles.skeletonCard}>
                                    <div className={styles.skeletonImage} />
                                    <div className={styles.skeletonLine} />
                                    <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
                                </div>
                            ))}
                        </div>
                    ) : pendingProfile ? (
                        <div className={styles.emptyState}>
                            <h3>Wait till profile approved</h3>
                            <p>Your preferences are saved. Suggestions will unlock automatically after admin approves your profile.</p>
                        </div>
                    ) : filteredMatches.length === 0 ? (
                        <div className={styles.emptyState}>
                            <h3>No profiles match these filters</h3>
                            <p>Try widening the age, height, city, or caste filters to see more relevant profiles.</p>
                        </div>
                    ) : (
                        <div className={styles.cardGrid}>
                            {filteredMatches.map((match) => (
                                <article key={match.id} className={styles.profileCard}>
                                    <div className={styles.imageWrap}>
                                        <Image
                                            src={match.photo_url || match.photos?.[0] || '/image 1.png'}
                                            alt={`${match.first_name || 'Member'} profile`}
                                            fill
                                            className={styles.profileImage}
                                            unoptimized
                                        />
                                    </div>
                                    <div className={styles.cardBody}>
                                        <h3 className={styles.profileName}>
                                            {match.first_name || 'Member'}, {getAge(match.date_of_birth) || 'N/A'}
                                        </h3>
                                        <p className={styles.profileMeta}>
                                            {match.occupation || match.degree || 'Profession not shared'}
                                            {match.city ? `, ${match.city}` : ''}
                                        </p>
                                        <div className={styles.profileFacts}>
                                            <span><MapPin size={14} /> {match.city || 'City open'}</span>
                                            <span><Ruler size={14} /> {match.height ? `${match.height} cm` : 'Height open'}</span>
                                        </div>
                                        <Link href={`/dashboard/profile/${match.id}`} className={styles.viewButton}>
                                            View Profile
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                {showFilters && (
                    <>
                        <button
                            type="button"
                            aria-label="Close filters"
                            className={styles.filterBackdrop}
                            onClick={() => setShowFilters(false)}
                        />
                        <aside className={styles.filterPanel}>
                            <div className={styles.filterPanelHeader}>
                                <div>
                                    <p className={styles.filterTitle}>Filter by</p>
                                    <p className={styles.filterHint}>Minimal live filters for quick browsing</p>
                                </div>
                                <button
                                    type="button"
                                    className={styles.closeFilters}
                                    onClick={() => setShowFilters(false)}
                                >
                                    <ChevronDown size={18} className={styles.closeIcon} />
                                </button>
                            </div>

                            <div className={styles.filterScrollable}>
                                <div className={styles.filterGroup}>
                                    <label>Age group</label>
                                    <div className={styles.inlineFields}>
                                        <select value={filters.ageMin} onChange={(event) => handleFilterChange('ageMin', event.target.value)} disabled={filtersDisabled}>
                                            <option value="">Any</option>
                                            {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
                                        </select>
                                        <select value={filters.ageMax} onChange={(event) => handleFilterChange('ageMax', event.target.value)} disabled={filtersDisabled}>
                                            <option value="">Any</option>
                                            {ageOptions.map((age) => <option key={age} value={age}>{age}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>City</label>
                                    <div className={styles.inputWrap}>
                                        <Search size={15} />
                                        <input
                                            value={filters.city}
                                            onChange={(event) => handleFilterChange('city', event.target.value)}
                                            placeholder="Search city"
                                            disabled={filtersDisabled}
                                        />
                                    </div>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>Height</label>
                                    <select value={filters.heightMin} onChange={(event) => handleFilterChange('heightMin', event.target.value)} disabled={filtersDisabled}>
                                        <option value="">Any</option>
                                        {heightOptions.map((height) => <option key={height} value={height}>{height} cm+</option>)}
                                    </select>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>Caste / Community</label>
                                    <input
                                        value={filters.caste}
                                        onChange={(event) => handleFilterChange('caste', event.target.value)}
                                        placeholder="Any"
                                        disabled={filtersDisabled}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={styles.clearButton}
                                    onClick={() => setFilters({ ageMin: '', ageMax: '', city: '', heightMin: '', caste: '' })}
                                    disabled={filtersDisabled}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </aside>
                    </>
                )}
            </section>
        </div>
    );
}
