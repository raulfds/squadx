import { useOnboarding } from '@/src/context/OnboardingContext';
import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingStep1() {
    const { updateData, data, submitProfile } = useOnboarding();
    const router = useRouter();
    const params = useLocalSearchParams();
    const returnTo = params.returnTo as string;

    const [username, setUsername] = useState(data.username || '');
    const [fullName, setFullName] = useState(data.full_name || '');
    const [bio, setBio] = useState(data.bio || '');
    const [birthDate, setBirthDate] = useState(data.birth_date || '');
    const [dateDisplay, setDateDisplay] = useState(data.birth_date ? data.birth_date.split('-').reverse().join('/') : '');
    const [gender, setGender] = useState(data.gender || '');
    const [cep, setCep] = useState('');
    const [city, setCity] = useState(data.city || '');
    const [state, setState] = useState(data.state || '');
    const [loadingLocation, setLoadingLocation] = useState(false); // Renamed from loadingCep to be more generic if needed
    const [loadingCep, setLoadingCep] = useState(false); // Keeping this for now, but loadingLocation might replace it

    /* Masks */
    const maskDate = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\d{4})\d+?$/, '$1');
    };

    const maskCep = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    };

    const handleDateChange = (text: string) => {
        setDateDisplay(maskDate(text));
        // Save as YYYY-MM-DD internally if valid
        if (text.length === 10) {
            const [day, month, year] = text.split('/');
            setBirthDate(`${year}-${month}-${day}`);
        } else {
            setBirthDate(''); // Invalid or incomplete
        }
    };

    const handleCepChange = async (text: string) => {
        const masked = maskCep(text);
        setCep(masked);

        if (masked.length === 9) {
            fetchAddress(masked.replace('-', ''));
        }
    };

    const fetchAddress = async (cleanCep: string) => {
        setLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setCity(data.localidade);
                setState(data.uf);
            } else {
                alert('CEP não encontrado.');
            }
        } catch (error) {
            console.log('Erro CEP:', error);
        } finally {
            setLoadingCep(false);
        }
    };


    // Load existing data if available (Edit Mode)
    useEffect(() => {
        const loadUserData = async () => {
            if (data.username) return; // Already has data, probably from context or just filled

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    // Populate local state
                    setUsername(profile.username || '');
                    setFullName(profile.full_name || '');
                    setBio(profile.bio || '');
                    setBirthDate(profile.birth_date || '');
                    setGender(profile.gender || '');
                    setCity(profile.city || '');
                    setState(profile.state || '');

                    if (profile.birth_date) {
                        setDateDisplay(profile.birth_date.split('-').reverse().join('/'));
                    }

                    // Populate Context for next steps
                    updateData({
                        ...profile,
                        // Ensure arrays are initialized
                        photos: profile.photos || [],
                        game_genres: profile.game_genres || [],
                        availability: profile.availability || {},
                    });
                }
            } catch (error) {
                console.log('Error loading user data for edit:', error);
            }
        };

        loadUserData();
    }, []);

    const handleNext = () => {
        if (!username || !birthDate || birthDate.length !== 10) {
            alert('Por favor, preencha o nome de usuário e uma data de nascimento válida.');
            return;
        }
        updateData({ username, full_name: fullName, bio, birth_date: birthDate, gender, city, state });
        router.push('/onboarding/step2');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.stepIndicator}>Passo 1 de 5</Text>
                            <TouchableOpacity onPress={() => {
                                supabase.auth.signOut();
                                router.replace('/login');
                            }}>
                                <Text style={{ color: 'red', fontSize: 12 }}>Sair / Resetar</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.title}>Vamos nos conhecer</Text>
                        <Text style={styles.subtitle}>Preencha seus dados básicos para começar.</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Nome de Usuário *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="@seu_usuario"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={username}
                            onChangeText={setUsername}
                        />

                        <Text style={styles.label}>Nome Completo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Seu nome"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <Text style={styles.label}>Data de Nascimento (DD/MM/AAAA) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="01/01/2000"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={dateDisplay}
                            onChangeText={handleDateChange}
                            keyboardType="number-pad"
                            maxLength={10}
                        />

                        <Text style={styles.label}>Gênero</Text>
                        <View style={styles.genderContainer}>
                            {['Masculino', 'Feminino', 'Outro'].map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[styles.genderButton, gender === g && styles.genderButtonSelected]}
                                    onPress={() => setGender(g)}
                                >
                                    <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>CEP (Localização)</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="00000-000"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={cep}
                                onChangeText={handleCepChange}
                                keyboardType="number-pad"
                                maxLength={9}
                            />
                            {loadingCep && <ActivityIndicator style={{ marginLeft: 10 }} color={theme.colors.primary} />}
                        </View>

                        <View style={[styles.row, { marginTop: theme.spacing.md }]}>
                            <TextInput
                                style={[styles.input, { flex: 2, marginRight: 8, backgroundColor: theme.colors.background }]} // Grayed out logic implied
                                placeholder="Cidade"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={city}
                                editable={false}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: theme.colors.background }]}
                                placeholder="UF"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={state}
                                editable={false}
                            />
                        </View>

                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Fale um pouco sobre você..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity style={[styles.nextButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 }]} onPress={() => {
                        supabase.auth.signOut();
                        router.replace('/login');
                    }}>
                        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
                        <Text style={[styles.nextButtonText, { color: theme.colors.text }]}>Voltar / Sair</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>{returnTo ? 'Salvar' : 'Próximo'}</Text>
                        <Ionicons name={returnTo ? "checkmark" : "arrow-forward"} size={20} color="#FFF" />
                    </TouchableOpacity>
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
        paddingBottom: 100, // Extra padding for bottom navigation
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
    input: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: 12,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
    },
    textArea: {
        minHeight: 100,
    },
    genderContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
        gap: 8,
    },
    genderButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    genderButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    genderText: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    genderTextSelected: {
        color: '#FFF',
    },
    nextButton: {
        backgroundColor: theme.colors.secondary,
        padding: theme.spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 18,
    },
});
