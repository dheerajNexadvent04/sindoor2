"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
    id?: string | null;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    photos: string[] | null;
    is_premium: boolean | null;
    gender: string | null;
    status: string | null;
}

const PROFILE_CACHE_KEY = 'sindoor_auth_profile';
const USER_CACHE_KEY = 'sindoor_auth_user';

type CachedUser = {
    id: string;
    email: string | null;
};

const readCachedProfile = (): UserProfile | null => {
    if (typeof window === 'undefined') return null;

    try {
        const rawProfile = window.localStorage.getItem(PROFILE_CACHE_KEY);
        if (!rawProfile) return null;
        return JSON.parse(rawProfile) as UserProfile;
    } catch (error) {
        console.error('AuthProvider: failed to read cached profile', error);
        return null;
    }
};

const writeCachedProfile = (profile: UserProfile | null) => {
    if (typeof window === 'undefined') return;

    try {
        if (!profile) {
            window.localStorage.removeItem(PROFILE_CACHE_KEY);
            return;
        }

        window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } catch (error) {
        console.error('AuthProvider: failed to write cached profile', error);
    }
};

const readCachedUser = (): CachedUser | null => {
    if (typeof window === 'undefined') return null;

    try {
        const rawUser = window.localStorage.getItem(USER_CACHE_KEY);
        if (!rawUser) return null;
        return JSON.parse(rawUser) as CachedUser;
    } catch (error) {
        console.error('AuthProvider: failed to read cached user', error);
        return null;
    }
};

const writeCachedUser = (user: CachedUser | null) => {
    if (typeof window === 'undefined') return;

    try {
        if (!user) {
            window.localStorage.removeItem(USER_CACHE_KEY);
            return;
        }

        window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('AuthProvider: failed to write cached user', error);
    }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isInvalidRefreshTokenError = (error: unknown) => {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
                ? error
                : '';
    return /invalid refresh token|refresh token not found/i.test(message);
};

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    profileChecked: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    profileChecked: false,
    loading: true,
    signOut: async () => { },
    refreshSession: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileChecked, setProfileChecked] = useState(false);
    const [loading, setLoading] = useState(true);

    const applySession = (nextSession: Session | null) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
            setProfileChecked(false);
            writeCachedUser({
                id: nextSession.user.id,
                email: nextSession.user.email ?? null,
            });
            const cachedProfile = readCachedProfile();
            if (cachedProfile && cachedProfile.id === nextSession.user.id) {
                setProfile(cachedProfile);
                setProfileChecked(true);
            }
            void fetchProfile(nextSession.user.id);
        } else {
            setProfile(null);
            setProfileChecked(true);
            writeCachedProfile(null);
            writeCachedUser(null);
        }
    };

    const syncAuthState = async () => {
        try {
            const { data: { session: localSession } } = await supabase.auth.getSession();
            applySession(localSession ?? null);
        } catch (error) {
            console.error("AuthProvider: syncAuthState error:", error);
            if (isInvalidRefreshTokenError(error)) {
                try {
                    await supabase.auth.signOut({ scope: 'local' });
                } catch (signOutError) {
                    console.error("AuthProvider: failed to clear invalid session locally:", signOutError);
                }
                applySession(null);
                return;
            }
            // Keep existing in-memory/cached session state for transient network or
            // browser storage timing errors (common on mobile refresh).
        }
    };

    const fetchProfile = async (userId: string) => {
        let lastError: unknown = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, photo_url, photos, is_premium, gender, status')
                    .eq('id', userId)
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                if (data) {
                    setProfile(data);
                    writeCachedProfile(data);
                    setProfileChecked(true);
                    return;
                }

                const cachedProfile = readCachedProfile();
                if (cachedProfile?.id === userId) {
                    setProfile(cachedProfile);
                    setProfileChecked(true);
                    return;
                }

                setProfile(null);
                writeCachedProfile(null);
                setProfileChecked(true);
                return;
            } catch (err) {
                lastError = err;
                if (attempt === 0) {
                    await supabase.auth.refreshSession();
                }
                if (attempt < 2) {
                    await wait(250 * (attempt + 1));
                }
            }
        }

        const cachedProfile = readCachedProfile();
        if (cachedProfile?.id === userId) {
            setProfile(cachedProfile);
            setProfileChecked(true);
            return;
        }

        setProfileChecked(true);
        console.error("AuthProvider: profile fetch failed after retries:", lastError);
    };

    useEffect(() => {
        const cachedUser = readCachedUser();
        const cachedProfile = readCachedProfile();

        if (cachedUser) {
            setUser({ id: cachedUser.id, email: cachedUser.email } as User);
        }
        if (cachedProfile && (!cachedUser || cachedProfile.id === cachedUser.id)) {
            setProfile(cachedProfile);
            setProfileChecked(true);
        }

        const getInitialSession = async () => {
            try {
                await syncAuthState();
            } catch (error) {
                console.error("AuthProvider: Initial session error:", error);
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                applySession(session);
                setLoading(false);

                if (event === 'PASSWORD_RECOVERY' && typeof window !== 'undefined' && window.location.pathname !== '/update-password') {
                    window.location.assign(`/update-password${window.location.search}${window.location.hash}`);
                }
            }
        );

        const handleFocusOrRestore = async () => {
            await syncAuthState();
        };

        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) handleFocusOrRestore();
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') handleFocusOrRestore();
        };

        window.addEventListener('pageshow', onPageShow);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('pageshow', onPageShow);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    const refreshSession = async () => {
        try {
            await syncAuthState();
        } catch (error) {
            console.error("AuthProvider: refreshSession error:", error);
        }
    };

    const signOut = async () => {
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileChecked(true);
        setLoading(false);
        writeCachedProfile(null);
        writeCachedUser(null);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, profileChecked, loading, signOut, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
