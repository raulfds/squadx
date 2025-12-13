import { useOnboarding } from '@/src/context/OnboardingContext';
import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OnboardingStep2() {
    const { updateData, data } = useOnboarding();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<string[]>(data.photos || []);

    const pickImage = async () => {
        if (photos.length >= 3) {
            Alert.alert('Limite atingido', 'Você pode adicionar no máximo 3 fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${session.user.id}/${Date.now()}.${ext}`;
            const formData = new FormData();

            // @ts-ignore
            formData.append('file', {
                uri,
                name: fileName,
                type: `image/${ext}`,
            });

            const { data: uploadData, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, formData, {
                    contentType: `image/${ext}`,
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setPhotos(prev => [...prev, publicUrl]);
        } catch (error: any) {
            console.error('Upload Error:', error);
            Alert.alert('Erro no Upload', 'Falha ao enviar imagem. Verifique se o bucket "avatars" existe no Supabase.');
        } finally {
            setLoading(false);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        if (photos.length === 0) {
            Alert.alert('Foto obrigatória', 'Adicione pelo menos uma foto para continuar.');
            return;
        }
        updateData({ photos });
        router.push('/onboarding/step3');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.stepIndicator}>Passo 2 de 5</Text>
                    <Text style={styles.title}>Suas Melhores Fotos</Text>
                    <Text style={styles.subtitle}>Adicione até 3 fotos para o seu perfil.</Text>
                </View>

                <View style={styles.photosContainer}>
                    {photos.map((photo, index) => (
                        <View key={index} style={styles.photoWrapper}>
                            <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
                            <TouchableOpacity style={styles.removeButton} onPress={() => removePhoto(index)}>
                                <Ionicons name="close" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {photos.length < 3 && (
                        <TouchableOpacity style={styles.addButton} onPress={pickImage} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color={theme.colors.textSecondary} />
                            ) : (
                                <Ionicons name="add" size={40} color={theme.colors.textSecondary} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.hint}>A primeira foto será sua foto de perfil principal.</Text>

                <View style={{ flex: 1 }} />

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
        flexGrow: 1,
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
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: theme.spacing.md,
    },
    photoWrapper: {
        width: 100,
        height: 125,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 100,
        height: 125,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    hint: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginBottom: theme.spacing.xl,
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
