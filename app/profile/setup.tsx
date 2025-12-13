import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { GameSearch } from '../../src/components/GameSearch'; // Assuming GameSearch component path
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';

export default function ProfileSetup() {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [cep, setCep] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    // Gamertags
    const [discord, setDiscord] = useState('');
    const [psn, setPsn] = useState('');
    const [xbox, setXbox] = useState('');
    const [steam, setSteam] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);

    const handleCepBlur = async () => {
        if (cep.length !== 8) return;

        setLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                Alert.alert('Erro', 'CEP não encontrado.');
                return;
            }

            setCity(data.localidade);
            setState(data.uf);
        } catch (error) {
            Alert.alert('Erro', 'Falha ao buscar CEP.');
        } finally {
            setLoadingCep(false);
        }
    };

    /* New State for Games */
    const [selectedGames, setSelectedGames] = useState<any[]>([]);

    const toggleGame = (game: any) => {
        if (selectedGames.find(g => g.id === game.id)) {
            setSelectedGames(selectedGames.filter(g => g.id !== game.id));
        } else {
            if (selectedGames.length >= 5) {
                Alert.alert('Limite atingido', 'Você pode selecionar até 5 jogos.');
                return;
            }
            setSelectedGames([...selectedGames, game]);
        }
    };

    const handleSave = async () => {
        if (username.length < 3) {
            Alert.alert('Erro', 'O nome de usuário deve ter pelo menos 3 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) throw new Error('Usuário não autenticado.');

            // Save Profile
            const updates = {
                id: session.user.id,
                username,
                bio,
                city,
                state,
                discord_handle: discord,
                psn_handle: psn,
                xbox_handle: xbox,
                steam_handle: steam,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').insert(updates);

            if (error) {
                if (error.code === '23505') { // Unique violation for username
                    throw new Error('Este nome de usuário já está em uso.');
                }
                throw error;
            }

            // Save User Games
            if (selectedGames.length > 0) {
                const favoritesToInsert = selectedGames.map(game => ({
                    user_id: session.user.id,
                    game_id: game.id,
                    game_name: game.name,
                    game_cover_url: game.cover_url,
                    game_genres: game.genres
                }));

                const { error: gamesError } = await supabase
                    .from('user_favorites')
                    .insert(favoritesToInsert);

                if (gamesError) {
                    console.error('Error saving games:', gamesError);
                    // Don't block flow, but maybe warn?
                }
            }

            router.replace('/(tabs)/explore');

        } catch (error: any) {
            Alert.alert('Erro ao salvar perfil', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    <FlatList
                        ListHeaderComponent={
                            <>
                                <Text style={styles.title}>Crie seu Perfil</Text>
                                <Text style={styles.subtitle}>
                                    Conte-nos um pouco sobre você para encontrar seu squad ideal.
                                </Text>

                                <View style={styles.form}>
                                    <Text style={styles.label}>Nome de Usuário</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: GamerPro123"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />

                                    <Text style={styles.label}>Bio (Opcional)</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="Quais jogos você curte? Qual seu estilo de jogo?"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={bio}
                                        onChangeText={setBio}
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />

                                    <Text style={styles.label}>Localização (Opcional)</Text>
                                    <View style={styles.row}>
                                        <View style={{ flex: 1 }}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="CEP (apenas números)"
                                                placeholderTextColor={theme.colors.textSecondary}
                                                value={cep}
                                                onChangeText={(text) => setCep(text.replace(/[^0-9]/g, ''))}
                                                keyboardType="numeric"
                                                maxLength={8}
                                                onBlur={handleCepBlur}
                                            />
                                        </View>
                                        {loadingCep && <ActivityIndicator style={{ marginLeft: 8 }} color={theme.colors.primary} />}
                                    </View>

                                    {(city !== '' || state !== '') && (
                                        <View style={styles.locationResult}>
                                            <Ionicons name="location" size={16} color={theme.colors.secondary} />
                                            <Text style={styles.locationText}>{city} - {state}</Text>
                                        </View>
                                    )}

                                    <Text style={styles.label}>Jogos Favoritos ({selectedGames.length}/5)</Text>
                                    <GameSearch onSelectGame={toggleGame} />

                                    {/* Selected Games Badges */}
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                        {selectedGames.map(game => (
                                            <View key={game.id} style={{ backgroundColor: theme.colors.surface, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={{ color: '#FFF', marginRight: 4 }}>{game.name}</Text>
                                                <TouchableOpacity onPress={() => toggleGame(game)}>
                                                    <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </>
                        }
                        data={[]}
                        renderItem={null}
                        ListFooterComponent={
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>Começar</Text>
                                )}
                            </TouchableOpacity>
                        }
                    />
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    inner: {
        flex: 1,
        padding: theme.spacing.xl,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl,
        lineHeight: 24,
    },
    form: {
        gap: theme.spacing.md,
    },
    label: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.md,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    textArea: {
        minHeight: 100,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: theme.spacing.md,
        height: 56,
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationResult: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
    },
    locationText: {
        color: theme.colors.text,
        marginLeft: theme.spacing.xs,
    },
    gamertagContainer: {
        gap: 8,
    },
    gamertagInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
    },
    gamertagIcon: {
        marginRight: theme.spacing.sm,
    },
    inputFlex: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        fontSize: 16,
        color: theme.colors.text,
    }
});
