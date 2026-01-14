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

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingField, setEditingField] = useState('');
    const [editingLabel, setEditingLabel] = useState('');
    const [editingValue, setEditingValue] = useState('');
    const [editingMultiline, setEditingMultiline] = useState(false);

    const openEdit = (field: string, label: string, value: string, multiline = false) => {
        setEditingField(field);
        setEditingLabel(label);
        setEditingValue(value || '');
        setEditingMultiline(multiline);
        setEditModalVisible(true);
    };

    const handleSaveField = async (field: string, value: string) => {
        const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', profile.id);
        if (error) throw error;
        setProfile((prev: any) => ({ ...prev, [field]: value }));
    };

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
                    <TouchableOpacity style={styles.sectionEditButton} onPress={() => router.push('/onboarding/step2')}>
                        <Ionicons name="pencil" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Identity */}
                {/* Identity */}
                <View style={styles.infoSection}>
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.nameRow}>
                                <Text style={styles.username}>{profile?.username || 'Novo Usuário'}</Text>
                                {profile?.gender && <View style={styles.tag}><Text style={styles.tagText}>{profile.gender}</Text></View>}
                            </View>
                            <Text style={styles.fullName}>{profile?.full_name}</Text>
                        </View>
                        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/onboarding/step1')}>
                            <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>

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

                    {/* Reputation Row - Now Included in Identity Section for prominence, or separate? User said "junto com as notas" */}
                    {/* I'll put it right after the bio or maybe before? Usually reputation is high priority. Let's put it after bio for flow. */}

                    {ratings && (
                        <View style={styles.reputationContainer}>
                            <Text style={styles.sectionSubtitle}>Reputação</Text>
                            <View style={styles.reputationRow}>
                                {/* Overall Score */}
                                <View style={styles.repItem}>
                                    <View style={[styles.repIcon, { backgroundColor: theme.colors.secondary }]}>
                                        <Ionicons name="star" size={20} color="#000" />
                                    </View>
                                    <Text style={styles.repValue}>
                                        {((ratings.avg_respect + ratings.avg_communication + ratings.avg_humor + ratings.avg_collaboration) / 4).toFixed(1)}
                                    </Text>
                                    <Text style={styles.repLabel}>Geral</Text>
                                </View>

                                <View style={styles.verticalDivider} />

                                <View style={styles.repItem}>
                                    <View style={[styles.repIcon, { backgroundColor: '#4CB5F5' }]}>
                                        <Ionicons name="thumbs-up" size={16} color="#FFF" />
                                    </View>
                                    <Text style={styles.repValue}>{ratings.avg_respect || '-'}</Text>
                                    <Text style={styles.repLabel}>Resp.</Text>
                                </View>

                                <View style={styles.repItem}>
                                    <View style={[styles.repIcon, { backgroundColor: '#B7B8B6' }]}>
                                        <Ionicons name="chatbubbles" size={16} color="#FFF" />
                                    </View>
                                    <Text style={styles.repValue}>{ratings.avg_communication || '-'}</Text>
                                    <Text style={styles.repLabel}>Com.</Text>
                                </View>

                                <View style={styles.repItem}>
                                    <View style={[styles.repIcon, { backgroundColor: '#FFD93E' }]}>
                                        <Ionicons name="happy" size={16} color="#FFF" />
                                    </View>
                                    <Text style={styles.repValue}>{ratings.avg_humor || '-'}</Text>
                                    <Text style={styles.repLabel}>Humor</Text>
                                </View>

                                <View style={styles.repItem}>
                                    <View style={[styles.repIcon, { backgroundColor: '#6F00FF' }]}>
                                        <Ionicons name="people" size={16} color="#FFF" />
                                    </View>
                                    <Text style={styles.repValue}>{ratings.avg_collaboration || '-'}</Text>
                                    <Text style={styles.repLabel}>Colab.</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={[styles.editButton, { marginTop: 20, borderColor: theme.colors.error, backgroundColor: 'transparent' }]} onPress={handleSignOut}>
                    <Text style={[styles.editButtonText, { color: theme.colors.error }]}>Sair da Conta</Text>
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
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconButton: {
        padding: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionEditButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: theme.colors.primary,
        padding: 8,
        borderRadius: 20,
    },
    // New Reputation Styles
    overallRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        marginLeft: 8,
    },
    overallRatingText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    reputationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: 16,
    },
    repItem: {
        alignItems: 'center',
        flex: 1,
    },
    repIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    repValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    repLabel: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    reputationContainer: {
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
    },
    verticalDivider: {
        width: 1,
        height: '80%',
        backgroundColor: theme.colors.border,
        marginHorizontal: 8,
    },
    platformRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
});
