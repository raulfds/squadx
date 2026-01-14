import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialButton } from '../src/components/SocialButton';
import { supabase } from '../src/lib/supabase';
import { theme } from '../src/theme';

WebBrowser.maybeCompleteAuthSession(); // Required for web browser redirect

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleEmailAuth = async () => {
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Verifique seu e-mail', 'Enviamos um link de confirmação para o seu e-mail.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    if (error.message.includes('Invalid login credentials') || error.message.includes('User not found')) {
                        Alert.alert(
                            'Conta não encontrada',
                            'Este e-mail ainda não possui cadastro. Deseja criar uma conta agora?',
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                {
                                    text: 'Criar Conta',
                                    onPress: () => setIsSignUp(true)
                                }
                            ]
                        );
                        return;
                    }
                    throw error;
                }
            }
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setLoading(false);
        }
    };

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
                    skipBrowserRedirect: true, // We want Supabase to return the URL so we can open it manually
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

        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/squadx-logo.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, !isSignUp && styles.activeTab]}
                        onPress={() => setIsSignUp(false)}
                    >
                        <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>Entrar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, isSignUp && styles.activeTab]}
                        onPress={() => setIsSignUp(true)}
                    >
                        <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>Cadastrar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>
                        {isSignUp ? 'Criar conta' : 'Bem-vindo de volta!'}
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="E-mail"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={handleEmailAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.authButtonText}>
                                {isSignUp ? 'Continuar' : 'Entrar'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OU</Text>
                    <View style={styles.dividerLine} />
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
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 0,
    },
    buttonsContainer: {
        width: '100%',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: theme.colors.primary,
    },
    tabText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    activeTabText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    formContainer: {
        width: '100%',
        marginBottom: theme.spacing.md,
    },
    formTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.sm,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        height: 48,
    },
    authButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.sm,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 4,
        height: 48,
        justifyContent: 'center',
    },
    authButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
    },
    dividerText: {
        color: theme.colors.textSecondary,
        paddingHorizontal: theme.spacing.md,
        fontSize: 12,
    },
});
