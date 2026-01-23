import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleAuth = async () => {
            try {
                const url = await Linking.getInitialURL();
                if (url) {
                    const { params, errorCode } = QueryParams.getQueryParams(url);

                    if (errorCode) throw new Error(errorCode);

                    const { access_token, refresh_token } = params;

                    if (access_token && refresh_token) {
                        const { error } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        if (error) throw error;
                    }
                }
            } catch (error) {
                console.error('Error handling auth callback:', error);
            } finally {
                // Always redirect to home, the auth listener in layout will handle protection
                router.replace('/');
            }
        };

        handleAuth();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator size="large" color="#ff005c" />
            <Text style={{ color: '#fff', marginTop: 20 }}>Verificando login...</Text>
        </View>
    );
}
