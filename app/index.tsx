import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { theme } from '../src/theme';

export default function Index() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        console.log('[Index] Component mounted');
        setIsMounted(true);

        const checkSession = async () => {
            console.log('[Index] Checking session...');
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                console.log('[Index] Session result:', session ? 'Found' : 'Null', error);

                if (session) {
                    console.log('[Index] Fetching profile for:', session.user.id);
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    console.log('[Index] Profile result:', profile ? 'Found' : 'Null', profileError);

                    if (profile) {
                        console.log('[Index] Redirecting to Explore');
                        router.replace('/(tabs)/explore');
                    } else {
                        console.log('[Index] Redirecting to Setup');
                        router.replace('/profile/setup');
                    }
                } else {
                    console.log('[Index] No session, redirecting to Login');
                    router.replace('/login');
                }
            } catch (e) {
                console.error('[Index] Error during check:', e);
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Index] Auth state change:', event);
            // Logic repeated or simplified? For now let's rely on the initial check
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (!isMounted) return null;

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
}
