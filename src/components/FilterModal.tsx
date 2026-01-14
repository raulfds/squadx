import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';
import { Filters } from '../types';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    filters: Filters;
    onApply: (newFilters: Filters) => void;
}

export default function FilterModal({ visible, onClose, filters, onApply }: FilterModalProps) {
    const [localFilters, setLocalFilters] = useState<Filters>(filters);

    const updateFilter = (key: keyof Filters, value: any) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters = {
            minRespect: 1,
            minCommunication: 1,
            minHumor: 1,
            minCollaboration: 1,
            gender: undefined,
            minAge: 18,
            maxAge: 99,
            sameLocation: false,
            samePlatform: false,
            commonGames: false
        };
        setLocalFilters(resetFilters);
        onApply(resetFilters);
    };

    const renderSlider = (label: string, value: number, onValueChange: (val: number) => void, color: string, min = 1, max = 5, limitDisplay = false) => (
        <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{label}</Text>
                <Text style={[styles.sliderValue, { color }]}>{value}{limitDisplay && value === max ? '+' : ''}</Text>
            </View>
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={min}
                maximumValue={max}
                step={1}
                value={value}
                onValueChange={onValueChange}
                minimumTrackTintColor={color}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={color}
            />
        </View>
    );

    const renderSwitch = (label: string, value: boolean | undefined, onValueChange: (val: boolean) => void) => (
        <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{label}</Text>
            <Switch
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={value ? "#FFF" : "#f4f3f4"}
                onValueChange={onValueChange}
                value={!!value}
            />
        </View>
    );

    const GENDERS = ['Masculino', 'Feminino', 'Outro'];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Filtrar Jogadores</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionHeader}>Preferências</Text>

                        {/* Gender Selector */}
                        <View style={styles.genderContainer}>
                            <Text style={styles.label}>Gênero</Text>
                            <View style={styles.genderRow}>
                                <TouchableOpacity
                                    style={[styles.genderButton, !localFilters.gender && styles.genderButtonSelected]}
                                    onPress={() => updateFilter('gender', undefined)}
                                >
                                    <Text style={[styles.genderText, !localFilters.gender && styles.genderTextSelected]}>Todos</Text>
                                </TouchableOpacity>
                                {GENDERS.map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.genderButton, localFilters.gender === g && styles.genderButtonSelected]}
                                        onPress={() => updateFilter('gender', g)}
                                    >
                                        <Text style={[styles.genderText, localFilters.gender === g && styles.genderTextSelected]}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Age Sliders */}
                        {renderSlider("Idade Mínima", localFilters.minAge || 18, (v) => updateFilter('minAge', v), theme.colors.text, 18, 99)}
                        {renderSlider("Idade Máxima", localFilters.maxAge || 99, (v) => updateFilter('maxAge', v), theme.colors.textAndSecondary || theme.colors.text, 18, 99)}

                        <View style={styles.divider} />

                        <Text style={styles.sectionHeader}>Conexões</Text>
                        {renderSwitch("Mesma Cidade/Estado", localFilters.sameLocation, (v) => updateFilter('sameLocation', v))}
                        {renderSwitch("Mesmas Plataformas", localFilters.samePlatform, (v) => updateFilter('samePlatform', v))}
                        {renderSwitch("Jogos em Comum", localFilters.commonGames, (v) => updateFilter('commonGames', v))}

                        <View style={styles.divider} />

                        <Text style={styles.sectionHeader}>Avaliação Mínima (Stars)</Text>
                        <Text style={styles.subtitle}>Filtre pela reputação da comunidade:</Text>

                        {renderSlider("Respeito", localFilters.minRespect, (v) => updateFilter('minRespect', v), "#4CB5F5", 1, 5, true)}
                        {renderSlider("Comunicação", localFilters.minCommunication, (v) => updateFilter('minCommunication', v), "#B7B8B6", 1, 5, true)}
                        {renderSlider("Humor", localFilters.minHumor, (v) => updateFilter('minHumor', v), "#FFD93E", 1, 5, true)}
                        {renderSlider("Colaboração", localFilters.minCollaboration, (v) => updateFilter('minCollaboration', v), "#6F00FF", 1, 5, true)}

                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                            <Text style={styles.resetText}>Limpar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                            <Text style={styles.applyText}>Aplicar Filtros</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    subtitle: {
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
        fontSize: 14,
    },
    sliderContainer: {
        marginBottom: theme.spacing.md,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sliderLabel: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    sliderValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginTop: theme.spacing.lg,
    },
    resetButton: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    resetText: {
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    applyButton: {
        flex: 2,
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.md,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    switchLabel: {
        fontSize: 16,
        color: theme.colors.text,
    },
    genderContainer: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    genderRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    genderButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    genderButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    genderText: {
        color: theme.colors.text,
    },
    genderTextSelected: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
