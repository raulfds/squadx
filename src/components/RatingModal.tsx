import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

interface RatingModalProps {
    visible: boolean;
    onClose: () => void;
    ratedUserId: string;
    ratedUsername: string;
    onSuccess?: () => void;
}

export default function RatingModal({ visible, onClose, ratedUserId, ratedUsername, onSuccess }: RatingModalProps) {
    const [respect, setRespect] = useState(3);
    const [communication, setCommunication] = useState(3);
    const [humor, setHumor] = useState(3);
    const [collaboration, setCollaboration] = useState(3);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.from('user_ratings').insert({
                rater_id: session.user.id,
                rated_id: ratedUserId,
                respect,
                communication,
                humor,
                collaboration
            });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    Alert.alert('Ops', 'Você já avaliou este usuário.');
                } else {
                    Alert.alert('Erro', 'Falha ao enviar avaliação.');
                    console.error(error);
                }
                return;
            }

            Alert.alert('Sucesso', 'Avaliação enviada!');
            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderSlider = (label: string, value: number, setValue: (val: number) => void, color: string) => (
        <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{label}</Text>
                <Text style={[styles.sliderValue, { color }]}>{value}</Text>
            </View>
            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={value}
                onValueChange={setValue}
                minimumTrackTintColor={color}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={color}
            />
        </View>
    );

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Avaliar {ratedUsername}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>Como foi sua experiência com este jogador?</Text>

                    {renderSlider("Respeito", respect, setRespect, "#4CB5F5")}
                    {renderSlider("Comunicação", communication, setCommunication, "#B7B8B6")}
                    {renderSlider("Humor", humor, setHumor, "#FFD93E")}
                    {renderSlider("Colaboração", collaboration, setCollaboration, "#6F00FF")}

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitText}>Enviar Avaliação</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    content: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
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
        fontSize: 20,
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
    submitButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    submitText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
