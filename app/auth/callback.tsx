import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();
    const params = useLocalSearchParams();

    useEffect(() => {
        const handleAuth = async () => {
            try {
                console.log('Auth Callback Params:', JSON.stringify(params));

                const { access_token, refresh_token, error_description, error } = params;

                if (error) {
                    throw new Error(error_description as string || (error as string));
                }

                if (access_token && refresh_token) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: access_token as string,
                        refresh_token: refresh_token as string,
                    });
                    if (sessionError) throw sessionError;

                    console.log('Session set successfully in callback');
                } else {
                    console.log('No tokens found in params, assuming login.tsx handled it or checking session anyway.');
                    // Double check if we already have a session just in case login.tsx won the race
                    const { data } = await supabase.auth.getSession();
                    if (data.session) {
                        console.log('Session exists (race condition won by login.tsx?)');
                    } else {
                        // If we don't have tokens and no session, we might be stuck, but redirecting to home 
                        // will let the AuthProvider or root layout decide.
                        console.warn('No session established in callback.');
                    }
                }
            } catch (error) {
                console.error('Error handling auth callback:', error);
            } finally {
                // Always redirect to home, the auth listener in layout will handle protection
                router.replace('/');
            }
        };

        if (params) {
            handleAuth();
        }
    }, [params]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator size="large" color="#FF0054" />
            <Text style={{ color: '#fff', marginTop: 20, fontFamily: 'PermanentMarker_400Regular', fontSize: 20 }}>Verificando login...</Text>
        </View>
    );
}
