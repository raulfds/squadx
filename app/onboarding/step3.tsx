import { useOnboarding } from '@/src/context/OnboardingContext';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OnboardingStep3() {
    const { updateData, data } = useOnboarding();
    const router = useRouter();

    const [discord, setDiscord] = useState(data.discord_handle || '');
    const [psn, setPsn] = useState(data.psn_handle || '');
    const [xbox, setXbox] = useState(data.xbox_handle || '');
    const [steam, setSteam] = useState(data.steam_handle || '');

    const handleNext = () => {
        updateData({ discord_handle: discord, psn_handle: psn, xbox_handle: xbox, steam_handle: steam });
        router.push('/onboarding/step4');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.stepIndicator}>Passo 3 de 5</Text>
                        <Text style={styles.title}>Onde você joga?</Text>
                        <Text style={styles.subtitle}>Adicione seus IDs para facilitar a conexão.</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Discord</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="logo-discord" size={24} color="#5865F2" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: usuario#1234"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={discord}
                                onChangeText={setDiscord}
                            />
                        </View>

                        <Text style={styles.label}>PlayStation Network (PSN)</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="logo-playstation" size={24} color="#003087" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Seu ID PSN"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={psn}
                                onChangeText={setPsn}
                            />
                        </View>

                        <Text style={styles.label}>Xbox Live</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="logo-xbox" size={24} color="#107C10" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Gamertag"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={xbox}
                                onChangeText={setXbox}
                            />
                        </View>

                        <Text style={styles.label}>Steam</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="logo-steam" size={24} color="#1b2838" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Código de Amigo"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={steam}
                                onChangeText={setSteam}
                            />
                        </View>
                    </View>

                    <View style={{ gap: 10, marginTop: theme.spacing.md }}>
                        <TouchableOpacity style={[styles.nextButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                            <Text style={[styles.nextButtonText, { color: theme.colors.text }]}>Voltar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>Próximo</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    stepIndicator: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        marginBottom: theme.spacing.xs,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    form: {
        marginBottom: theme.spacing.xl,
    },
    label: {
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        color: theme.colors.text,
    },
    nextButton: {
        backgroundColor: theme.colors.secondary,
        padding: theme.spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: theme.spacing.md * 2,
    },
    nextButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
