import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { theme } from '../src/theme';

export default function Index() {
    const [isMounted, setIsMounted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        console.log('[Index] Component mounted');
        setIsMounted(true);

        let timeoutId: NodeJS.Timeout;

        const checkSession = async () => {
            console.log('[Index] Checking session...');
            try {
                // Safety Timeout: If Supabase doesn't respond in 5s, we force a decision
                timeoutId = setTimeout(() => {
                    console.log('[Index] Timeout reached. Supabase took too long.');
                    setErrorMsg('Demorou muito para conectar. Verifique sua internet.');
                }, 5000);

                const { data: { session }, error } = await supabase.auth.getSession();
                clearTimeout(timeoutId);

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
                        router.replace('/(tabs)/explore');
                    } else {
                        router.replace('/profile/setup');
                    }
                } else {
                    console.log('[Index] No session, redirecting to Login');
                    router.replace('/login');
                }
            } catch (e: any) {
                if (timeoutId) clearTimeout(timeoutId);
                console.error('[Index] Error during check:', e);
                setErrorMsg('Ocorreu um erro ao iniciar: ' + e.message);
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Index] Auth state change:', event);
        });

        return () => {
            authListener.subscription.unsubscribe();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    if (!isMounted) return null;

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            {errorMsg ? (
                <View style={{ marginTop: 20, alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: theme.colors.error, marginBottom: 10, textAlign: 'center' }}>{errorMsg}</Text>
                    <Text style={{ color: theme.colors.textSecondary, marginBottom: 20 }}>Tente reiniciar o app ou...</Text>
                    <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }} onPress={() => router.replace('/login')}>
                        Ir para Login
                    </Text>
                </View>
            ) : (
                <Text style={{ color: theme.colors.textSecondary, marginTop: 20 }}>Iniciando...</Text>
            )}
        </View>
    );
}
