import { useOnboarding } from '@/src/context/OnboardingContext';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GENRES = [
    'FPS', 'MOBA', 'RPG', 'Battle Royale',
    'Estratégia', 'Esportes', 'Corrida', 'Aventura',
    'Luta', 'Simulação', 'Terror', 'Puzzle'
];

const AVAILABILITY = [
    'Manhã', 'Tarde', 'Noite', 'Madrugada', 'Finais de Semana'
];

export default function OnboardingStep4() {
    const { updateData, data } = useOnboarding();
    const router = useRouter();

    const [selectedGenres, setSelectedGenres] = useState<string[]>(data.game_genres || []);
    const [selectedAvailability, setSelectedAvailability] = useState<string[]>(data.availability?.times || []);

    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const toggleAvailability = (time: string) => {
        setSelectedAvailability(prev =>
            prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
        );
    };

    const handleNext = () => {
        updateData({
            game_genres: selectedGenres,
            availability: { times: selectedAvailability }
        });
        router.push('/onboarding/step5');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.stepIndicator}>Passo 4 de 5</Text>
                    <Text style={styles.title}>Perfil Gamer</Text>
                    <Text style={styles.subtitle}>O que e quando você gosta de jogar?</Text>
                </View>

                <Text style={styles.sectionTitle}>Gêneros Favoritos</Text>
                <View style={styles.grid}>
                    {GENRES.map((genre) => (
                        <TouchableOpacity
                            key={genre}
                            style={[
                                styles.chip,
                                selectedGenres.includes(genre) && styles.chipSelected
                            ]}
                            onPress={() => toggleGenre(genre)}
                        >
                            <Text style={[
                                styles.chipText,
                                selectedGenres.includes(genre) && styles.chipTextSelected
                            ]}>{genre}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Disponibilidade</Text>
                <View style={styles.grid}>
                    {AVAILABILITY.map((time) => (
                        <TouchableOpacity
                            key={time}
                            style={[
                                styles.chip,
                                selectedAvailability.includes(time) && styles.chipSelected
                            ]}
                            onPress={() => toggleAvailability(time)}
                        >
                            <Text style={[
                                styles.chipText,
                                selectedAvailability.includes(time) && styles.chipTextSelected
                            ]}>{time}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ gap: 10, marginTop: theme.spacing.xl }}>
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
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: theme.spacing.xl,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    chipSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipText: {
        color: theme.colors.text,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    nextButton: {
        backgroundColor: theme.colors.secondary,
        padding: theme.spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: theme.spacing.xl,
    },
    nextButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
