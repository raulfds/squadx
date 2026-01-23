import { useOnboarding } from '@/src/context/OnboardingContext';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS = [
    'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

const PERIODS = ['Manhã', 'Tarde', 'Noite'];

export default function OnboardingStep5() {
    const { updateData, data, submitProfile } = useOnboarding();
    const router = useRouter();
    const params = useLocalSearchParams();
    const returnTo = params.returnTo as string;

    // Availability State: { "Segunda": ["Manhã", "Noite"], ... }
    const [availability, setAvailability] = useState<{ [key: string]: string[] }>(data.availability || {});

    // Sync local state with context data
    useEffect(() => {
        if (data.availability) {
            setAvailability(data.availability);
        }
    }, [data.availability]);

    const toggleAvailability = (day: string, period: string) => {
        setAvailability(prev => {
            const dayPeriods = prev[day] || [];
            if (dayPeriods.includes(period)) {
                return { ...prev, [day]: dayPeriods.filter(p => p !== period) };
            } else {
                return { ...prev, [day]: [...dayPeriods, period] };
            }
        });
    };

    const handleNext = async () => {
        updateData({ availability });

        // Final step: submit profile
        try {
            await submitProfile({ availability });
            if (returnTo) {
                router.replace(returnTo);
            } else {
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            alert('Erro ao salvar perfil: ' + error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Text style={styles.stepIndicator}>Passo 5 de 5</Text>
                <Text style={styles.title}>Disponibilidade</Text>
                <Text style={styles.subtitle}>Quando você costuma jogar?</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.scheduleGrid}>
                    {/* Header Row */}
                    <View style={styles.scheduleRow}>
                        <View style={[styles.scheduleCell, { flex: 1.5 }]} />
                        {PERIODS.map(period => (
                            <View key={period} style={styles.scheduleCell}>
                                <Text style={styles.scheduleHeader}>{period}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Day Rows */}
                    {DAYS.map(day => (
                        <View key={day} style={styles.scheduleRow}>
                            <View style={[styles.scheduleCell, { flex: 1.5, alignItems: 'flex-start', paddingLeft: 4 }]}>
                                <Text style={styles.dayLabel}>{day}</Text>
                            </View>
                            {PERIODS.map(period => {
                                const isSelected = availability[day]?.includes(period);
                                return (
                                    <View key={`${day}-${period}`} style={styles.scheduleCell}>
                                        <TouchableOpacity
                                            style={[styles.periodButton, isSelected && styles.periodButtonSelected]}
                                            onPress={() => toggleAvailability(day, period)}
                                        >
                                            {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                    <Text style={[styles.navButtonText, { color: theme.colors.text }]}>Voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={handleNext}>
                    <Text style={styles.navButtonText}>{returnTo ? 'Salvar' : 'Concluir'}</Text>
                    <Ionicons name={returnTo ? "checkmark" : "checkmark-circle"} size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
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
    scrollContent: {
        padding: theme.spacing.lg,
        paddingTop: 0,
        flexGrow: 1,
    },
    /* Schedule Grid Styles */
    scheduleGrid: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: theme.spacing.md,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    scheduleCell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scheduleHeader: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    dayLabel: {
        color: theme.colors.text,
        fontWeight: '500',
        fontSize: 14,
    },
    periodButton: {
        width: '80%',
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF', // Light slot
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    periodButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    footer: {
        padding: theme.spacing.lg,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: theme.colors.background,
    },
    navButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    backButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    nextButton: {
        backgroundColor: theme.colors.secondary,
    },
    navButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#000',
    },
});
