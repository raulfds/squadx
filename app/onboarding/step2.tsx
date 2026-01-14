import { useOnboarding } from '@/src/context/OnboardingContext';
import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingStep2() {
    const { updateData, data, submitProfile } = useOnboarding();
    const router = useRouter();
    const params = useLocalSearchParams();
    const returnTo = params.returnTo as string;

    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<string[]>(data.photos || []);

    // Load data if accessing directly
    useEffect(() => {
        const load = async () => {
            if (data.username) {
                setPhotos(data.photos || []);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                updateData({ ...profile, photos: profile.photos || [], game_genres: profile.game_genres || [], availability: profile.availability || {} });
                setPhotos(profile.photos || []);
            }
        };
        load();
    }, []);


    // ... pickImage and uploadImage functions ... (keep them or verify if I need to re-include them if I am replacing the whole block, I should use replace_file_content carefully)
    // I will target the imports and the beginning of the component to add the hooks, and the button section to update the button.
    // Wait, the replace_file_content replaces a block. I need to be careful not to overwrite the middle logic `pickImage` etc if I target too broadly.
    // Better to make 2 replaces: one for imports/setup, one for buttons.

    // Changing strategy: using 2 separate calls if needed or ensuring target content includes enough context but not the whole file logic.

    // Actually, I can replace the component start to inject variables, and the useEffect.
    // And replace the buttons at the end.

    // Let's do imports first.

    const pickImage = async () => {
        if (photos.length >= 3) {
            Alert.alert('Limite atingido', 'Você pode adicionar no máximo 3 fotos.');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 5],
                quality: 1,
            });

            if (!result.canceled) {
                // Resize and compress
                const manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 1080 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );
                uploadImage(manipResult.uri);
            }
        } catch (err) {
            console.error('Error picking image:', err);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
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
            if (error.message && (error.message.includes('Bucket not found') || error.statusCode === '404' || error.message.includes('404'))) {
                Alert.alert(
                    'Configuração Necessária',
                    'O bucket "avatars" não foi encontrado no Supabase. Crie-o como público no painel do Supabase.'
                );
            } else {
                Alert.alert('Erro no Upload', 'Falha ao enviar imagem. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleNext = async () => {
        if (photos.length === 0) {
            Alert.alert('Foto obrigatória', 'Adicione pelo menos uma foto para continuar.');
            return;
        }
        updateData({ photos });

        if (returnTo) {
            try {
                await submitProfile();
                router.replace(returnTo);
            } catch (e: any) {
                alert('Erro ao salvar: ' + e.message);
            }
        } else {
            router.push('/onboarding/step3');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
                        <Text style={styles.nextButtonText}>{returnTo ? 'Salvar' : 'Próximo'}</Text>
                        <Ionicons name={returnTo ? "checkmark" : "arrow-forward"} size={20} color="#FFF" />
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
