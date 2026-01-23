import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialButton } from '../src/components/SocialButton';
import { supabase } from '../src/lib/supabase';
import { theme } from '../src/theme';

WebBrowser.maybeCompleteAuthSession(); // Required for web browser redirect

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);

    const handleLogin = async (provider: 'google' | 'discord' | 'twitch') => {
        setLoading(true);
        try {
            // Create a redirect URL that matches the scheme configured in app.json and Supabase
            const redirectUrl = makeRedirectUri({
                scheme: 'squadx',
                path: 'auth/callback'
            });

            console.log('Redirecting to:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                // Open the authentication session
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success' && result.url) {
                    // Extract session parameters from the return URL
                    const { params, errorCode } = QueryParams.getQueryParams(result.url);
                    if (errorCode) throw new Error(errorCode);

                    const { access_token, refresh_token } = params;

                    if (access_token && refresh_token) {
                        const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
                        if (sessionError) throw sessionError;
                        // Determine where to go based on user state (handled by auth listener usually, or manual check)
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            // Check if profile exists to decide dest? Usually root layout handles this.
                        }
                    }
                }
            }

        } catch (error: any) {
            console.error('Login Error:', error);
            Alert.alert('Erro no Login', error.message || 'Falha ao conectar com o provedor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/squadx-mascot.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                    <Text style={styles.title}>Squadx</Text>
                </View>

                <View style={styles.buttonsContainer}>
                    <SocialButton provider="google" onPress={() => handleLogin('google')} isLoading={loading} />
                    <SocialButton provider="discord" onPress={() => handleLogin('discord')} isLoading={loading} />
                    <SocialButton provider="twitch" onPress={() => handleLogin('twitch')} isLoading={loading} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
        alignItems: 'center',
        gap: 95, // Reduced gap to bring Buttons closer to Brand
    },
    logoContainer: {
        alignItems: 'center',
        gap: 8, // Removed gap
    },
    logo: {
        width: 380,
        height: 380,
    },
    title: {
        fontFamily: 'PermanentMarker_400Regular',
        fontSize: 72,
        color: theme.colors.primary,
        letterSpacing: 2,
        textShadowColor: 'rgba(255, 0, 84, 0.6)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
        marginTop: -140, // Pull text up closer to the image
        zIndex: 1, // Ensure text is on top if they overlap slightly
    },
    buttonsContainer: {
        width: '90%',
        gap: 4,
        paddingHorizontal: theme.spacing.md,
    },
});
