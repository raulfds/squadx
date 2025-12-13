import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';

const { width } = Dimensions.get('window');

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

            if (error) {
                // If profile not found, maybe redirect to onboarding?
                // For now just allow empty
                console.log('Profile fetch error or empty:', error.message);
            }
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

    // Render Photos Carousel
    const renderPhotos = () => {
        const photos = profile?.photos || [];
        if (photos.length === 0 && profile?.avatar_url) {
            photos.push(profile.avatar_url);
        }

        if (photos.length === 0) return (
            <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color={theme.colors.textSecondary} />
            </View>
        );

        return (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
                {photos.map((photo: string, index: number) => (
                    <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.carouselImage}
                        contentFit="cover"
                    />
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meu Perfil</Text>
                <TouchableOpacity onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Photos */}
                <View style={styles.photosSection}>
                    {renderPhotos()}
                    {!profile?.photos?.length && !profile?.avatar_url && (
                        <Text style={styles.noPhotosText}>Sem fotos</Text>
                    )}
                </View>

                {/* Identity */}
                <View style={styles.infoSection}>
                    <View style={styles.nameRow}>
                        <Text style={styles.username}>{profile?.username || 'Novo Usuário'}</Text>
                        {profile?.gender && <View style={styles.tag}><Text style={styles.tagText}>{profile.gender}</Text></View>}
                    </View>
                    <Text style={styles.fullName}>{profile?.full_name}</Text>

                    {profile?.city && profile?.state && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={16} color={theme.colors.textSecondary} />
                            <Text style={styles.location}>{profile.city} - {profile.state}</Text>
                        </View>
                    )}

                    {profile?.birth_date && (
                        <Text style={styles.detailText}>🎂 {profile.birth_date.split('-').reverse().join('/')}</Text>
                    )}

                    <Text style={styles.bio}>{profile?.bio || 'Escreva algo sobre você...'}</Text>
                </View>

                {/* Genres & Availability */}
                {(profile?.game_genres?.length > 0 || profile?.availability?.times?.length > 0) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Perfil Gamer</Text>

                        {profile?.game_genres?.length > 0 && (
                            <View style={styles.chipRow}>
                                {profile.game_genres.map((g: string) => (
                                    <View key={g} style={styles.chip}>
                                        <Text style={styles.chipText}>{g}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {profile?.availability?.times?.length > 0 && (
                            <View style={styles.availabilityBox}>
                                <Text style={styles.subTitle}>Disponibilidade:</Text>
                                <Text style={styles.bodyText}>{profile.availability.times.join(', ')}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Socials / Platforms */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Plataformas</Text>
                    <View style={styles.platformsContainer}>
                        {profile?.discord_handle ? <Text style={styles.platformText}><Ionicons name="logo-discord" size={16} color="#5865F2" /> {profile.discord_handle}</Text> : null}
                        {profile?.psn_handle ? <Text style={styles.platformText}><Ionicons name="logo-playstation" size={16} color="#003087" /> {profile.psn_handle}</Text> : null}
                        {profile?.xbox_handle ? <Text style={styles.platformText}><Ionicons name="logo-xbox" size={16} color="#107C10" /> {profile.xbox_handle}</Text> : null}
                        {profile?.steam_handle ? <Text style={styles.platformText}><Ionicons name="logo-steam" size={16} color="#1b2838" /> {profile.steam_handle}</Text> : null}

                        {!profile?.discord_handle && !profile?.psn_handle && !profile?.xbox_handle && !profile?.steam_handle && (
                            <Text style={styles.emptyText}>Nenhuma conta vinculada.</Text>
                        )}
                    </View>
                </View>

                {/* Ratings */}
                {ratings && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Reputação</Text>
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

                {/* Edit Button Placeholder */}
                <TouchableOpacity style={styles.editButton} onPress={() => router.push('/onboarding/step1')}>
                    <Text style={styles.editButtonText}>Editar Perfil</Text>
                </TouchableOpacity>

            </ScrollView>
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
    photosSection: {
        height: 300,
        backgroundColor: '#000',
        marginBottom: theme.spacing.md,
    },
    carousel: {
        flex: 1,
    },
    carouselImage: {
        width: width,
        height: 300,
    },
    avatarPlaceholder: {
        width: width,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    noPhotosText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        top: 140,
        color: theme.colors.textSecondary,
    },
    infoSection: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    username: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    fullName: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    tag: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tagText: {
        color: theme.colors.text,
        fontSize: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    location: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    detailText: {
        color: theme.colors.text,
        marginBottom: 8,
    },
    bio: {
        fontSize: 16,
        color: theme.colors.text,
        marginTop: 8,
        lineHeight: 22,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: theme.spacing.md,
    },
    chip: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    chipText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    availabilityBox: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: 8,
    },
    subTitle: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginBottom: 4,
    },
    bodyText: {
        color: theme.colors.text,
        fontSize: 16,
    },
    platformsContainer: {
        gap: 8,
    },
    platformText: {
        color: theme.colors.text,
        fontSize: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
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
    editButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        margin: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    editButtonText: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
