"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    photos: string[] | null;
    is_premium: boolean | null;
    gender: string | null;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshSession: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const applySession = async (nextSession: Session | null) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
            await fetchProfile(nextSession.user.id);
        } else {
            setProfile(null);
        }
    };

    const syncAuthState = async () => {
        try {
            const { data: { session: localSession } } = await supabase.auth.getSession();

            if (localSession?.user) {
                await applySession(localSession);
                return;
            }

            const { data: { user: remoteUser }, error } = await supabase.auth.getUser();
            if (error) {
                console.error("AuthProvider: getUser error:", error);
            }

            if (remoteUser) {
                await applySession({
                    access_token: '',
                    refresh_token: '',
                    expires_in: 0,
                    expires_at: 0,
                    token_type: 'bearer',
                    user: remoteUser,
                } as Session);
            } else {
                await applySession(null);
            }
        } catch (error) {
            console.error("AuthProvider: syncAuthState error:", error);
            await applySession(null);
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('first_name, last_name, photo_url, photos, is_premium, gender')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                setProfile(data);
            } else {
                setProfile(null);
                if (error) console.log("AuthProvider: Profile fetch error (likely no profile):", error.message);
            }
        } catch (err) {
            console.error("Error in fetchProfile:", err);
            setProfile(null);
        }
    };

    useEffect(() => {
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
            async (event, session) => {
                console.log("AuthProvider: onAuthStateChange event:", event, "User:", session?.user?.email);
                await applySession(session);
                setLoading(false);
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
        setLoading(false);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
