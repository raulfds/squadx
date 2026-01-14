import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase';

type AuthContextType = {
    session: Session | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.log('Error fetching session:', error.message);
                if (error.message.includes('Refresh Token')) {
                    // Token inválido, forçar logout para limpar estado
                    await supabase.auth.signOut();
                }
            }
            setSession(session);
            setLoading(false);
        };

        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (loading) return;

        const checkProfileAndRedirect = async () => {
            if (session) {
                // Check if profile exists and has username
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', session.user.id)
                    .single();

                const onLoginPage = segments[0] === 'login';
                const onOnboarding = segments[0] === 'onboarding';

                if (!profile?.username) {
                    // Profile incomplete -> Force Onboarding
                    if (!onOnboarding) {
                        router.replace('/onboarding/step1');
                    }
                } else {
                    // Profile complete -> Go to Tabs (if on login or onboarding)
                    if (onLoginPage || onOnboarding) {
                        router.replace('/(tabs)');
                    }
                }
            } else {
                // No session
                const inProtectedRoute = segments[0] === '(tabs)' || segments[0] === 'onboarding';
                if (inProtectedRoute) {
                    router.replace('/login');
                }
            }
        };

        checkProfileAndRedirect();
    }, [session, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
                <ActivityIndicator size="large" color="#04d361" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ session, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
