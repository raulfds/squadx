import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { theme } from '../src/theme';

export default function Index() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                // Check if user has a profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    router.replace('/(tabs)/explore');
                } else {
                    router.replace('/profile/setup');
                }
            } else {
                router.replace('/login');
            }
        });

        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    router.replace('/(tabs)/explore');
                } else {
                    router.replace('/profile/setup');
                }
            } else {
                router.replace('/login');
            }
        });
    }, []);

    if (!isMounted) return null;

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
}
