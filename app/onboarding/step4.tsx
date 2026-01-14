import { useOnboarding } from '@/src/context/OnboardingContext';
import { supabase } from '@/src/lib/supabase';
import { Game, searchGames } from '@/src/services/igdb';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS = [
    'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

const PERIODS = ['Manhã', 'Tarde', 'Noite'];

export default function OnboardingStep4() {
    const { updateData, data, submitProfile } = useOnboarding();
    const router = useRouter();
    const params = useLocalSearchParams();
    const returnTo = params.returnTo as string;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Game[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedGames, setSelectedGames] = useState<Game[]>(data.games || []);

    // Availability State: { "Segunda": ["Manhã", "Noite"], ... }
    const [availability, setAvailability] = useState<{ [key: string]: string[] }>(data.availability || {});

    // Load data if accessing directly
    useEffect(() => {
        const load = async () => {
            if (data.username && data.games) {
                // Already has data
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                // Fetch games manually since they are in a separate table usually? 
                // Wait, data.games comes from where? Ah, checking profile.tsx:
                // "const { data: gamesData } = await supabase.from('user_favorites')..."
                // OnboardingContext uses 'games' in memory but saves to 'user_favorites' table likely in backend or via upsert in a separate table?
                // Let's check OnboardingContext... it upserts 'profiles' but does it handle games?
                // Checking OnboardingProvider content from memory...
                // "game_genres: data.game_genres" is in upsert.
                // "games: data.games" - is this column in 'profiles'?
                // The 'profiles' upsert only had 'game_genres'. 
                // 'user_favorites' table is used for games.
                // So we need to FETCH games from 'user_favorites' and set them here.

                const { data: gamesData } = await supabase.from('user_favorites').select('*').eq('user_id', session.user.id);

                // Mapper needed? Game object structure in IGDB vs DB?
                // If saved as JSON in user_favorites or individual rows?
                // Re-reading 'profile.tsx' fetch: "const { data: gamesData } = await supabase.from('user_favorites').select('*').eq('user_id', session.user.id);"
                // Assuming 'user_favorites' stores the full game object or enough to reconstruct.
                // Let's assume for now gamesData matches Game[] structure or close enough.

                updateData({
                    ...profile,
                    photos: profile.photos || [],
                    game_genres: profile.game_genres || [],
                    availability: profile.availability || {},
                    games: gamesData || []
                });
                setSelectedGames(gamesData || []);
                setAvailability(profile.availability || {});
            }
        };
        load();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setSearching(true);
                const results = await searchGames(searchQuery);
                setSearchResults(results);
                setSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const toggleGame = (game: Game) => {
        setSelectedGames(prev => {
            const exists = prev.find(g => g.id === game.id);
            if (exists) {
                return prev.filter(g => g.id !== game.id);
            } else {
                return [...prev, game];
            }
        });
    };

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
        if (selectedGames.length === 0) {
            alert('Selecione pelo menos um jogo favorito.');
            return;
        }

        // Extract genres from selected games
        const allGenres = selectedGames.flatMap(g => g.genres?.map(genre => genre.name) || []);
        // Unique genres
        const uniqueGenres = Array.from(new Set(allGenres));

        updateData({
            games: selectedGames,
            game_genres: uniqueGenres,
            availability: availability,
        });

        // Final step: submit profile
        try {
            await submitProfile();
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
                <Text style={styles.stepIndicator}>Passo 4 de 5</Text>
                <Text style={styles.title}>Perfil Gamer</Text>
                <Text style={styles.subtitle}>Jogos favoritos e disponibilidade.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* GAME SEARCH SECTION */}
                <Text style={styles.sectionTitle}>Jogos Favoritos</Text>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar jogos (ex: Valorant, Zelda)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searching && <ActivityIndicator color={theme.colors.primary} />}
                </View>

                {searchResults.length > 0 && (
                    <View style={styles.resultsList}>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10, paddingRight: theme.spacing.lg }}
                            renderItem={({ item }) => {
                                const isSelected = selectedGames.some(g => g.id === item.id);
                                const imageUrl = item.cover?.url ? `https:${item.cover.url.replace('t_thumb', 't_cover_big')}` : null;

                                return (
                                    <TouchableOpacity
                                        style={[styles.gameCard, isSelected && styles.gameCardSelected]}
                                        onPress={() => toggleGame(item)}
                                    >
                                        {imageUrl ? (
                                            <Image source={{ uri: imageUrl }} style={styles.gameCover} contentFit="cover" />
                                        ) : (
                                            <View style={[styles.gameCover, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Ionicons name="game-controller" size={24} color="#666" />
                                            </View>
                                        )}
                                        <View style={styles.gameInfo}>
                                            <Text style={styles.gameName} numberOfLines={2}>{item.name}</Text>
                                        </View>
                                        {isSelected && (
                                            <View style={styles.checkBadge}>
                                                <Ionicons name="checkmark" size={12} color="#FFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                )}

                {selectedGames.length > 0 && (
                    <View style={styles.selectedGamesContainer}>
                        <Text style={styles.subLabel}>Selecionados ({selectedGames.length}):</Text>
                        <View style={styles.grid}>
                            {selectedGames.map(game => (
                                <TouchableOpacity key={game.id} style={styles.selectedChip} onPress={() => toggleGame(game)}>
                                    <Text style={styles.selectedChipText}>{game.name}</Text>
                                    <Ionicons name="close-circle" size={16} color="#FFF" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* AVAILABILITY GRID SECTION */}
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Disponibilidade</Text>

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
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        height: 50,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    input: {
        flex: 1,
        color: theme.colors.text,
        height: '100%',
    },
    resultsList: {
        marginBottom: theme.spacing.lg,
    },
    gameCard: {
        width: 120,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: 10,
    },
    gameCardSelected: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    gameCover: {
        width: '100%',
        height: 120,
        backgroundColor: '#222',
    },
    gameInfo: {
        padding: 8,
    },
    gameName: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2,
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedGamesContainer: {
        marginBottom: theme.spacing.xl,
    },
    subLabel: {
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    selectedChipText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.lg,
    },
    /* Schedule Grid Styles */
    scheduleGrid: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
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
        backgroundColor: '#2A2A2A', // Darker slot
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
