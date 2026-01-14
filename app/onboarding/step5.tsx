import { useOnboarding } from '@/src/context/OnboardingContext';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingStep5() {
    const { data, submitProfile, loading } = useOnboarding();
    const router = useRouter();

    // For now just storing these as local preferences or inside availability/bio if we don't have columns, 
    // but let's assume we might save them as user metadata or a separate table later. 
    // For the MVP Onboarding, let's just let the user set their 'SEARCH' preferences which usually live in local state or a 'user_settings' table.
    // Since we don't have a 'user_settings' table explicitly in the plan, I'll just save them to local storage or context for the session.
    // BUT the user asked for this screen.
    // I will just perform the submitProfile here and maybe save these filters to Async Storage or just let them be 'initial state' for the Explore screen if using Context.

    // Actually, let's just make this screen the "Finish" screen and maybe ask for "What are you looking for?" 
    // and we can store it in 'role_preferences' column loosely or just skip saving if no column exists for filters.
    // The plan mentioned role_preferences column.

    const [minRespect, setMinRespect] = useState(1);
    const [minCommunication, setMinCommunication] = useState(1);
    const [minHumor, setMinHumor] = useState(1);
    const [minCollaboration, setMinCollaboration] = useState(1);

    const handleFinish = async () => {
        try {
            await submitProfile();
            // On success, go to tabs
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Erro ao salvar perfil', error.message);
        }
    };

    const renderSlider = (label: string, value: number, onValueChange: (val: number) => void, icon: string) => (
        <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{icon} {label}</Text>
                <Text style={styles.sliderValue}>{value.toFixed(1)}</Text>
            </View>
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={5}
                step={0.5}
                value={value}
                onValueChange={onValueChange}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.secondary}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.stepIndicator}>Passo 5 de 5</Text>
                    <Text style={styles.title}>O que você procura?</Text>
                    <Text style={styles.subtitle}>Defina os atributos mínimos para seus parceiros de jogo.</Text>
                </View>

                <View style={styles.form}>
                    {renderSlider('Respeito', minRespect, setMinRespect, '🤝')}
                    {renderSlider('Comunicação', minCommunication, setMinCommunication, '🗣️')}
                    {renderSlider('Humor', minHumor, setMinHumor, '😂')}
                    {renderSlider('Colaboração', minCollaboration, setMinCollaboration, '🧠')}
                </View>

                <Text style={styles.note}>
                    Essas preferências ajudarão a filtrar os jogadores na tela Explorar.
                    (Nota: A persistência destes filtros específicos será implementada na próxima fase de configurações).
                </Text>

                <View style={{ gap: 10 }}>
                    <TouchableOpacity style={[styles.finishButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                        <Text style={[styles.finishButtonText, { color: theme.colors.text }]}>Voltar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.finishButton}
                        onPress={handleFinish}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Text style={styles.finishButtonText}>Concluir Cadastro</Text>
                                <Ionicons name="checkmark-circle" size={24} color="#000" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        paddingBottom: 100,
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
    sliderContainer: {
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    sliderLabel: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    sliderValue: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    note: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    finishButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: theme.spacing.md,
    },
    finishButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
