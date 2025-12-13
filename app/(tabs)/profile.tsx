import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';

export default function ProfileScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [games, setGames] = useState<any[]>([]);
    const [ratings, setRatings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/login');
                return;
            }

            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;
            setProfile(profileData);

            // Fetch Ratings
            const { data: ratingData } = await supabase
                .from('user_rating_averages')
                .select('*')
                .eq('rated_id', session.user.id)
                .single();
            setRatings(ratingData);

            // Fetch Games
            const { data: gamesData } = await supabase
                .from('user_favorites')
                .select('*')
                .eq('user_id', session.user.id);
            setGames(gamesData || []);

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar seu perfil.');
        }
    };

    const loadData = async () => {
        setLoading(true);
        await fetchProfile();
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meu Perfil</Text>
                <TouchableOpacity onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListHeaderComponent={
                    <>
                        <View style={styles.profileHeader}>
                            <Image
                                source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }}
                                style={styles.avatar}
                            />
                            <Text style={styles.username}>{profile?.username}</Text>
                            <Text style={styles.bio}>{profile?.bio || 'Sem bio...'}</Text>
                            {profile?.city && profile?.state && (
                                <Text style={styles.location}>{profile.city} - {profile.state}</Text>
                            )}
                        </View>

                        {ratings && (
                            <View style={styles.statsContainer}>
                                <Text style={styles.sectionTitle}>Médias de Avaliação</Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Respeito</Text>
                                        <Text style={styles.statValue}>{ratings.avg_respect || '-'}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Humor</Text>
                                        <Text style={styles.statValue}>{ratings.avg_humor || '-'}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Comunic.</Text>
                                        <Text style={styles.statValue}>{ratings.avg_communication || '-'}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Colab.</Text>
                                        <Text style={styles.statValue}>{ratings.avg_collaboration || '-'}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={styles.gamesSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Meus Jogos</Text>
                            </View>
                            {games.length === 0 ? (
                                <Text style={styles.emptyText}>Nenhum jogo favorito adicionado.</Text>
                            ) : (
                                <View style={styles.gamesGrid}>
                                    {games.map(game => (
                                        <View key={game.id} style={styles.gameCard}>
                                            <Image
                                                source={{ uri: game.game_cover_url || 'https://via.placeholder.com/80' }}
                                                style={styles.gameCover}
                                                contentFit="cover"
                                            />
                                            <Text style={styles.gameName} numberOfLines={1}>{game.game_name}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </>
                }
                data={[]}
                renderItem={null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        paddingTop: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: theme.spacing.md,
        borderWidth: 3,
        borderColor: theme.colors.primary,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    bio: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    location: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    statsContainer: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    gamesSection: {
        padding: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gameCard: {
        width: 100,
        alignItems: 'center',
    },
    gameCover: {
        width: 100,
        height: 140,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#333',
    },
    gameName: {
        color: theme.colors.text,
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '500',
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    }
});
