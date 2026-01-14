import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (field: string, value: string) => Promise<void>;
    field: string;
    initialValue: string;
    label: string;
    multiline?: boolean;
}

export default function EditProfileModal({ visible, onClose, onSave, field, initialValue, label, multiline = false }: EditProfileModalProps) {
    const [value, setValue] = useState(initialValue);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(field, value);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.content, multiline && { height: 300 }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Editar {label}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.input, multiline && styles.textArea]}
                        value={value}
                        onChangeText={setValue}
                        multiline={multiline}
                        textAlignVertical={multiline ? 'top' : 'center'}
                        placeholder={`Digite seu ${label}...`}
                        placeholderTextColor={theme.colors.textSecondary}
                        autoFocus
                    />

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.saveButtonText}>Salvar</Text>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: theme.spacing.lg,
        paddingBottom: 40,
        minHeight: 200,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.md,
        color: theme.colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.xl,
    },
    textArea: {
        height: 150,
    },
    saveButton: {
        backgroundColor: theme.colors.secondary,
        padding: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
