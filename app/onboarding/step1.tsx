import { useOnboarding } from '@/src/context/OnboardingContext';
import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingStep1() {
    const { updateData, data } = useOnboarding();
    const router = useRouter();
    const params = useLocalSearchParams();
    const returnTo = params.returnTo as string;

    const [username, setUsername] = useState(data.username || '');
    const [fullName, setFullName] = useState(data.full_name || '');
    const [bio, setBio] = useState(data.bio || '');
    const [birthDate, setBirthDate] = useState(data.birth_date || '');
    const [dateDisplay, setDateDisplay] = useState(data.birth_date ? data.birth_date.split('-').reverse().join('/') : '');
    const [gender, setGender] = useState(data.gender || 'Outro');
    const [cep, setCep] = useState(data.cep || '');
    const [city, setCity] = useState(data.city || '');
    const [state, setState] = useState(data.state || '');
    const [latitude, setLatitude] = useState<number | null>(data.latitude || null);
    const [longitude, setLongitude] = useState<number | null>(data.longitude || null);
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
            // Using BrasilAPI V2 for Coordinates
            const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
            const data = await response.json();
            console.log('BrasilAPI Response for', cleanCep, ':', JSON.stringify(data));

            if (!data.errors) {
                setCity(data.city);
                setState(data.state);

                // Check specifically for valid latitude/longitude
                if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
                    console.log('Coordinates found via BrasilAPI:', data.location.coordinates);
                    setLatitude(parseFloat(data.location.coordinates.latitude));
                    setLongitude(parseFloat(data.location.coordinates.longitude));
                } else {
                    console.log('Coordinates MISSING in BrasilAPI, trying Nominatim fallback...');
                    // Fallback: Use OpenStreetMap Nominatim with address details
                    await fetchCoordinatesFromAddress(data.street, data.city, data.state);
                }
            } else {
                alert('CEP não encontrado.');
            }
        } catch (error) {
            console.log('Erro CEP:', error);
        } finally {
            setLoadingCep(false);
        }
    };

    const fetchCoordinatesFromAddress = async (street: string, city: string, state: string) => {
        try {
            // Nominatim API requires User-Agent
            const query = `${street}, ${city}, ${state}, Brazil`;
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

            console.log('Fetching Nominatim:', url);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SquadxApp/1.0'
                }
            });
            const results = await response.json();

            if (results && results.length > 0) {
                const location = results[0];
                console.log('Nominatim found:', location.lat, location.lon);
                setLatitude(parseFloat(location.lat));
                setLongitude(parseFloat(location.lon));
            } else {
                console.log('Nominatim returned no results.');
            }
        } catch (err) {
            console.warn('Nominatim Fallback Error:', err);
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
                    const loadedCep = profile.cep || '';
                    setCep(loadedCep);

                    if (profile.birth_date) {
                        setDateDisplay(profile.birth_date.split('-').reverse().join('/'));
                    }

                    // Auto-fetch coordinates if they are missing but CEP exists (Legacy Data Fix)
                    if (loadedCep && (!profile.latitude || !profile.longitude)) {
                        console.log('Missing coordinates for existing CEP, fetching...', loadedCep);
                        fetchAddress(loadedCep.replace(/\D/g, ''));
                    } else {
                        setLatitude(profile.latitude);
                        setLongitude(profile.longitude);
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

    const handleNext = async () => {
        if (!username || !birthDate || birthDate.length !== 10) {
            alert('Por favor, preencha o nome de usuário e uma data de nascimento válida.');
            return;
        }

        const updates = {
            username,
            full_name: fullName,
            bio,
            birth_date: birthDate,
            gender,
            city,
            state,
            latitude,
            longitude,
            cep
        };

        updateData(updates);

        if (returnTo) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    console.log('UPDATING PROFILE DIRECTLY:', JSON.stringify(updates, null, 2));
                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            ...updates,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', session.user.id);

                    if (error) throw error;
                    router.replace(returnTo);
                }
            } catch (error) {
                console.error("Error saving profile update:", error);
                alert("Erro ao salvar alterações.");
            }
            return;
        }

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
    form: {
        marginBottom: theme.spacing.xl,
    },
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.lg,
        paddingBottom: 40,
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
    label: {
        color: theme.colors.textSecondary,
        marginBottom: 8,
        marginTop: 16,
        fontWeight: '500',
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.md,
        color: theme.colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    textArea: {
        height: 120,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    genderButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
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
    row: {
        flexDirection: 'row',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});


