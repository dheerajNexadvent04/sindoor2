"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Briefcase, ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type ProfileDetails = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    date_of_birth: string | null;
    height: number | null;
    about_me: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    occupation: string | null;
    degree: string | null;
    religion_name: string | null;
    caste_name: string | null;
    photo_url: string | null;
    photos: string[] | null;
  };

const getAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return 'N/A';
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age;
};

export default function DashboardProfileDetailsPage() {
    const params = useParams<{ id: string }>();
    const profileId = params?.id;
    const [profile, setProfile] = React.useState<ProfileDetails | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [shortlisted, setShortlisted] = React.useState(false);
    const [busy, setBusy] = React.useState(false);

    React.useEffect(() => {
        const loadProfile = async () => {
            if (!profileId) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, date_of_birth, height, about_me, city, state, country, occupation, degree, religion_name, caste_name, photo_url, photos')
                    .eq('id', profileId)
                    .single();

                if (error) throw error;
                setProfile(data as ProfileDetails);

                await fetch('/api/views', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ viewedProfileId: profileId }),
                });

                const shortlistRes = await fetch('/api/shortlist');
                if (shortlistRes.ok) {
                    const shortlistJson = await shortlistRes.json();
                    const alreadyShortlisted = (shortlistJson.data || []).some((item: { shortlisted_profile?: { id?: string } }) => item.shortlisted_profile?.id === profileId);
                    setShortlisted(alreadyShortlisted);
                }
            } catch (error) {
                console.error('Profile details load failed:', error);
            } finally {
                setLoading(false);
            }
        };

        void loadProfile();
    }, [profileId]);

    const handleShortlistToggle = async () => {
        if (!profileId || busy) return;
        setBusy(true);
        try {
            const response = shortlisted
                ? await fetch(`/api/shortlist/${profileId}`, { method: 'DELETE' })
                : await fetch('/api/shortlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileId }),
                });

            if (!response.ok) {
                const json = await response.json().catch(() => null);
                throw new Error(json?.error || 'Unable to update interest');
            }

            setShortlisted((current) => !current);
        } catch (error) {
            console.error(error);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '24px', color: '#6b7280' }}>Loading profile...</div>;
    }

    if (!profile) {
        return <div style={{ padding: '24px', color: '#6b7280' }}>Profile not found.</div>;
    }

    return (
        <div style={{ display: 'grid', gap: '24px' }}>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#374151', textDecoration: 'none', fontWeight: 600 }}>
                <ArrowLeft size={18} />
                Back to dashboard
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: '24px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)' }}>
                <div style={{ position: 'relative', minHeight: '440px', borderRadius: '22px', overflow: 'hidden', background: '#f3f4f6' }}>
                    <Image
                        src={profile.photo_url || profile.photos?.[0] || '/image 1.png'}
                        alt={profile.first_name || 'Profile'}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                    />
                </div>

                <div style={{ display: 'grid', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'start' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827' }}>
                                {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Member'}
                            </h1>
                            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '1rem' }}>
                                {getAge(profile.date_of_birth)} years, {profile.height ? `${profile.height} cm` : 'Height open'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleShortlistToggle}
                            disabled={busy}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                border: 'none',
                                borderRadius: '999px',
                                padding: '12px 18px',
                                background: shortlisted ? '#e31e24' : '#fff0f1',
                                color: shortlisted ? 'white' : '#e31e24',
                                fontWeight: 700,
                                cursor: busy ? 'wait' : 'pointer',
                            }}
                        >
                            <Heart size={18} fill={shortlisted ? 'currentColor' : 'none'} />
                            {shortlisted ? 'Remove interest' : 'Show interest'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '12px', color: '#374151' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <Briefcase size={18} color="#e31e24" />
                            <span>{profile.occupation || profile.degree || 'Profession not shared'}</span>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={18} color="#e31e24" />
                            <span>{[profile.city, profile.state, profile.country].filter(Boolean).join(', ') || 'Location not shared'}</span>
                        </div>
                        <div>
                            <strong>Community:</strong> {[profile.religion_name, profile.caste_name].filter(Boolean).join(', ') || 'Open'}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                        <h2 style={{ margin: '0 0 10px', color: '#111827', fontSize: '1.15rem' }}>About</h2>
                        <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.7 }}>
                            {profile.about_me || 'This member has not shared an introduction yet.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
