import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

    const updateFilter = (key: keyof Filters, value: number) => {
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
            minCollaboration: 1
        };
        setLocalFilters(resetFilters);
        onApply(resetFilters);
    };

    const renderSlider = (label: string, value: number, onValueChange: (val: number) => void, color: string) => (
        <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{label}</Text>
                <Text style={[styles.sliderValue, { color }]}>{value}+</Text>
            </View>
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={value}
                onValueChange={onValueChange}
                minimumTrackTintColor={color}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={color}
            />
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Filtrar Jogadores</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>Selecione a média mínima desejada:</Text>

                    {renderSlider("Respeito", localFilters.minRespect, (v) => updateFilter('minRespect', v), "#4CB5F5")}
                    {renderSlider("Comunicação", localFilters.minCommunication, (v) => updateFilter('minCommunication', v), "#B7B8B6")}
                    {renderSlider("Humor", localFilters.minHumor, (v) => updateFilter('minHumor', v), "#FFD93E")}
                    {renderSlider("Colaboração", localFilters.minCollaboration, (v) => updateFilter('minCollaboration', v), "#6F00FF")}

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
    }
});
