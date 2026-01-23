import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileModal from '../../src/components/ProfileModal';
import RatingModal from '../../src/components/RatingModal';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';

export default function MatchesScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [matchGames, setMatchGames] = useState<any[]>([]);
    const [matchRating, setMatchRating] = useState<any>(null);

    useEffect(() => {
        fetchMatches();
    }, []);

    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Get matches where current user matched others (and they matched back)
            // This logic might need refinement depending on how 'matches' are stored. 
            // Assuming we check for mutual swipes or if there is a 'matches' table.
            // Based on handleSwipe in index.tsx, we check 'swipes' table.

            // Simplified match fetching: Find people I liked who also liked me
            // 0. Get My Coords
            const { data } = await supabase.from('profiles').select('latitude, longitude').eq('id', session.user.id).single();
            const myProfile = data as any;

            // 1. Get my likes
            const { data: myLikes } = await supabase
                .from('swipes')
                .select('swiped_id')
                .eq('swiper_id', session.user.id)
                .eq('is_like', true);

            if (!myLikes || myLikes.length === 0) {
                setMatches([]);
                return;
            }

            const myLikedIds = myLikes.map(l => l.swiped_id);

            // 2. Check which of them liked me back
            const { data: mutualSwipes, error } = await supabase
                .from('swipes')
                .select('swiper_id, profiles:swiper_id(*, latitude, longitude)') // Explicitly asking for lat/long
                .eq('swiped_id', session.user.id)
                .eq('is_like', true)
                .in('swiper_id', myLikedIds);

            if (error) throw error;

            // 3. Format data
            console.log('Distance Debug - Mutual Swipes Raw:', JSON.stringify(mutualSwipes, null, 2));

            const formattedMatches = mutualSwipes.map(item => {
                const profileData = item.profiles as any;
                const p = Array.isArray(profileData) ? profileData[0] : profileData;

                if (!p) return null;

                // Calculate distance
                let distance = null;

                const myLat = myProfile?.latitude;
                const myLng = myProfile?.longitude;
                const theirLat = p?.latitude;
                const theirLng = p?.longitude;

                if (myLat != null && myLng != null && theirLat != null && theirLng != null) {
                    distance = getDistanceFromLatLonInKm(myLat, myLng, theirLat, theirLng);
                    console.log(`Calculating for ${p.username}: ${distance} km`);
                } else {
                    console.log(`Skipping distance for ${p.username}: Missing Coords. Me(${myLat},${myLng}) Them(${theirLat},${theirLng})`);
                }

                return { ...p, distance_km: distance };
            }).filter(Boolean); // Filter out nulls
            setMatches(formattedMatches || []);

        } catch (error) {
            console.error('Error fetching matches:', error);
            Alert.alert('Erro', 'Não foi possível carregar seus matches.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedMatch) {
            fetchMatchDetails(selectedMatch.id);
        }
    }, [selectedMatch]);

    const fetchMatchDetails = async (userId: string) => {
        // Fetch Ratings
        const { data: ratingData } = await supabase
            .from('user_rating_averages')
            .select('*')
            .eq('rated_id', userId)
            .single();
        setMatchRating(ratingData);

        // Fetch Games
        const { data: gamesData } = await supabase
            .from('user_favorites')
            .select('*')
            .eq('user_id', userId);
        setMatchGames(gamesData || []);
    };

    const copyToClipboard = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copiado!', `${label} copiado para a área de transferência.`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.matchItem} onPress={() => setSelectedMatch(item)}>
            <Image
                source={{ uri: (item.photos && item.photos.length > 0) ? item.photos[0] : (item.avatar_url || 'https://via.placeholder.com/100') }}
                style={styles.avatar}
                contentFit="cover"
            />
            <View style={styles.info}>
                <Text style={styles.username}>{item.username}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
                    {item.birth_date && (
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                            {new Date().getFullYear() - new Date(item.birth_date).getFullYear()} anos
                        </Text>
                    )}
                    {item.birth_date && item.gender && (
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}> • </Text>
                    )}
                    {item.gender && (
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                            {item.gender}
                        </Text>
                    )}
                </View>

                {/* Location & Distance */}
                {(item.city && item.state) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Ionicons name="location-sharp" size={12} color={theme.colors.textSecondary} />
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginLeft: 2 }}>
                            {item.city} - {item.state}
                        </Text>
                    </View>
                )}
                {typeof item.distance_km === 'number' && (
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                        📍 {item.distance_km.toFixed(1)} km de você
                    </Text>
                )}
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.discord_handle || 'Toque para ver IDs...'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const PERIODS = ['Manhã', 'Tarde', 'Noite'];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Seus Matches</Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
            ) : (
                <FlatList
                    data={matches}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Nenhum match ainda. Continue explorando!</Text>
                    }
                />
            )}

            {/* Match Details Modal */}
            <ProfileModal
                visible={!!selectedMatch}
                onClose={() => setSelectedMatch(null)}
                profile={selectedMatch}
                reputation={matchRating}
                games={matchGames}
                isMatch={true}
                onRatePress={() => setRatingModalVisible(true)}
            />

            {selectedMatch && (
                <RatingModal
                    visible={ratingModalVisible}
                    onClose={() => setRatingModalVisible(false)}
                    ratedUserId={selectedMatch.id}
                    ratedUsername={selectedMatch.username}
                    ratedAvatarUrl={(selectedMatch?.photos && selectedMatch.photos.length > 0) ? selectedMatch.photos[0] : selectedMatch?.avatar_url}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
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
    list: {
        padding: theme.spacing.md,
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: theme.spacing.sm,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    info: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    lastMessage: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: theme.spacing.lg,
        height: '90%', // Almost full screen
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    modalSubtitle: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: 16,
    },
    carousel: {
        height: 300,
        marginBottom: 16,
    },
    carouselImage: {
        width: 400, // Roughly full width
        height: 300,
    },
    infoSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: 40,
    },
    bioText: {
        fontSize: 16,
        color: theme.colors.text,
        lineHeight: 22,
        marginBottom: 24,
    },
    sectionContainer: {
        marginBottom: 20,
        backgroundColor: theme.colors.background,
        padding: 12,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    reputationGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    repItem: {
        alignItems: 'center',
    },
    repLabel: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    repValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    // Shared Styles
    gameItem: {
        width: 60,
        alignItems: 'center',
        marginRight: 8,
    },
    gameIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        marginBottom: 4,
        backgroundColor: theme.colors.surface,
    },
    gameName: {
        color: theme.colors.text,
        fontSize: 10,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chip: {
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    chipText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 10,
    },
    scheduleGrid: {
        backgroundColor: theme.colors.background,
        padding: 8,
        borderRadius: 12,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    scheduleCell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scheduleHeader: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    dayLabel: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 11,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.border,
    },
    dotActive: {
        backgroundColor: theme.colors.primary,
    },
    // Platforms
    idsContainer: {
        gap: theme.spacing.md,
    },
    idRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    idText: {
        flex: 1,
        color: theme.colors.text,
        marginLeft: theme.spacing.md,
        fontSize: 16,
        fontWeight: '500',
    },
    rateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.secondary,
        padding: theme.spacing.md,
        borderRadius: 12,
        marginTop: theme.spacing.lg,
        gap: 8,
    },
    rateButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
