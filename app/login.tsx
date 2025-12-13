import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SocialButton } from '../src/components/SocialButton';
import { supabase } from '../src/lib/supabase';
import { theme } from '../src/theme';

WebBrowser.maybeCompleteAuthSession(); // Required for web browser redirect

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);

    const handleLogin = async (provider: 'google' | 'discord' | 'twitch') => {
        setLoading(true);
        try {
            const redirectUrl = makeRedirectUri({
                scheme: 'squadx',
                path: 'auth/callback'
            });

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: false, // We want Supabase to handle the redirect
                },
            });

            if (error) throw error;

            // Note: In a real Expo app, we might need to handle the URL manually if not using skipBrowserRedirect: true with openAuthSessionAsync
            // But Supabase's signInWithOAuth usually handles opening the browser if we don't pass skipBrowserRedirect. 
            // Actually, with React Native, it returns a URL we should open.

            if (data.url) {
                // We can use expo-auth-session or just WebBrowser
                // For simplicity, let's assume Supabase SDK + Expo logic
                // But often we need to open the URL manually:
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success' && result.url) {
                    // Parse session from URL fragment
                    const { params, errorCode } = QueryParams.getQueryParams(result.url);
                    if (errorCode) throw new Error(errorCode);

                    // Create session (access_token, refresh_token)
                    const { access_token, refresh_token } = params;
                    if (access_token && refresh_token) {
                        await supabase.auth.setSession({ access_token, refresh_token });
                    }
                }
            }

        } catch (error: any) {
            Alert.alert('Erro no Login', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                {/* Placeholder for Logo */}
                <View style={styles.logoBox}>
                    <Text style={styles.logoText}>SQUADX</Text>
                </View>
                <Text style={styles.subtitle}>Encontre seu duo perfeito.</Text>
            </View>

            <View style={styles.buttonsContainer}>
                <SocialButton provider="google" onPress={() => handleLogin('google')} isLoading={loading} />
                <SocialButton provider="discord" onPress={() => handleLogin('discord')} isLoading={loading} />
                <SocialButton provider="twitch" onPress={() => handleLogin('twitch')} isLoading={loading} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl * 2,
    },
    logoBox: {
        width: 120,
        height: 120,
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
    },
    subtitle: {
        color: theme.colors.textSecondary,
        fontSize: 18,
        textAlign: 'center',
    },
    buttonsContainer: {
        width: '100%',
    },
});
