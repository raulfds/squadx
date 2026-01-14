import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EditProfileModal from '../../src/components/EditProfileModal';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';

const DAYS = [
    'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

const PERIODS = ['Manhã', 'Tarde', 'Noite'];

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

    const toggleAvailability = async (day: string, period: string) => {
        if (!profile) return;

        const currentAvailability = profile.availability || {};
        const dayPeriods = currentAvailability[day] || [];

        let newDayPeriods;
        if (dayPeriods.includes(period)) {
            newDayPeriods = dayPeriods.filter((p: string) => p !== period);
        } else {
            newDayPeriods = [...dayPeriods, period];
        }

        const newAvailability = {
            ...currentAvailability,
            [day]: newDayPeriods
        };

        // Optimistic Update
        setProfile((prev: any) => ({ ...prev, availability: newAvailability }));

        // Save to DB (debounce could be better, but direct for now as per request)
        const { error } = await supabase
            .from('profiles')
            .update({ availability: newAvailability })
            .eq('id', profile.id);

        if (error) {
            console.error('Error saving availability:', error);
            // Revert on error? For now just log.
        }
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
                <View style={{ height: 40 }} />
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

                {/* Reputation (Moved to Top) */}
                {ratings && (
                    <View style={styles.section}>
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

                {/* Identity / Basic Info */}
                <View style={styles.infoSection}>
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.nameRow}>
                                <Text style={styles.username}>{profile?.username || 'Novo Usuário'}</Text>
                                <TouchableOpacity onPress={() => openEdit('username', 'Nome de Usuário', profile?.username)}>
                                    <Ionicons name="pencil" size={16} color={theme.colors.textSecondary} style={{ marginLeft: 8 }} />
                                </TouchableOpacity>

                                {profile?.gender && <View style={styles.tag}><Text style={styles.tagText}>{profile.gender}</Text></View>}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.fullName}>{profile?.full_name}</Text>
                                <TouchableOpacity onPress={() => openEdit('full_name', 'Nome Completo', profile?.full_name)}>
                                    <Ionicons name="pencil" size={14} color={theme.colors.textSecondary} style={{ marginLeft: 6 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/onboarding/step1')}>
                            <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {profile?.birth_date && (
                        <Text style={styles.detailText}>🎂 {profile.birth_date.split('-').reverse().join('/')}</Text>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <Text style={styles.sectionSubtitle}>Bio</Text>
                        <TouchableOpacity onPress={() => openEdit('bio', 'Bio', profile?.bio, true)}>
                            <Ionicons name="pencil" size={14} color={theme.colors.textSecondary} style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.bio}>{profile?.bio || 'Escreva algo sobre você...'}</Text>
                </View>

                {/* Location Section */}
                {profile?.city && profile?.state && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Localização</Text>
                            <TouchableOpacity onPress={() => router.push('/onboarding/step1')}>
                                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={16} color={theme.colors.textSecondary} />
                            <Text style={styles.location}>{profile.city} - {profile.state}</Text>
                        </View>
                    </View>
                )}

                {/* Games Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Meus Jogos</Text>
                        <TouchableOpacity onPress={() => router.push('/onboarding/step4')}>
                            <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Games List with Icons */}
                    {games?.length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                            <Text style={[styles.sectionSubtitle, { marginBottom: 8 }]}>Jogos</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                {games.map((g: any) => (
                                    <View key={g.game_id || g.id} style={styles.gameItem}>
                                        {g.game_cover_url ? (
                                            <Image source={{ uri: g.game_cover_url }} style={styles.gameIcon} />
                                        ) : (
                                            <View style={[styles.gameIcon, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Ionicons name="game-controller" size={24} color="#666" />
                                            </View>
                                        )}
                                        <Text style={styles.gameName} numberOfLines={1}>{g.game_name || g.name}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Genres Chips */}
                    {profile?.game_genres?.length > 0 && (
                        <View>
                            <Text style={[styles.sectionSubtitle, { marginBottom: 8 }]}>Categorias</Text>
                            <View style={styles.chipRow}>
                                {profile.game_genres.map((g: string) => (
                                    <View key={g} style={styles.chip}>
                                        <Text style={styles.chipText}>{g}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {!games?.length && !profile?.game_genres?.length && (
                        <Text style={styles.emptyText}>Sem jogos favoritos.</Text>
                    )}
                </View>

                {/* Availability Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Disponibilidade</Text>
                        {/* Inline editing enabled, no need for button or maybe button scrolls? */}
                        {/* We can keep the button as a shortcut or remove it since it's inline now. 
                         User said "Allow edit right there", so maybe just remove the pencil to step 5? 
                         Or keep it as advanced edit? Let's just remove the pencil since it's inline. */}
                    </View>

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
                                    <Text style={styles.dayLabel}>{day.slice(0, 3)}</Text>
                                </View>
                                {PERIODS.map(period => {
                                    const isSelected = profile?.availability?.[day]?.includes(period);
                                    return (
                                        <View key={`${day} -${period} `} style={styles.scheduleCell}>
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
                </View>

                {/* Socials / Platforms */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Plataformas</Text>
                        <TouchableOpacity onPress={() => router.push('/onboarding/step3')}>
                            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.platformsContainer}>
                        <View style={styles.platformRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="logo-discord" size={20} color="#5865F2" />
                                <Text style={styles.platformText}> {profile?.discord_handle || 'Vincular Discord'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => openEdit('discord_handle', 'Discord', profile?.discord_handle)}>
                                <Ionicons name="pencil" size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.platformRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="logo-playstation" size={20} color="#003087" />
                                <Text style={styles.platformText}> {profile?.psn_handle || 'Vincular PSN'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => openEdit('psn_handle', 'PSN', profile?.psn_handle)}>
                                <Ionicons name="pencil" size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.platformRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="logo-xbox" size={20} color="#107C10" />
                                <Text style={styles.platformText}> {profile?.xbox_handle || 'Vincular Xbox'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => openEdit('xbox_handle', 'Xbox', profile?.xbox_handle)}>
                                <Ionicons name="pencil" size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.platformRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="logo-steam" size={20} color="#1b2838" />
                                <Text style={styles.platformText}> {profile?.steam_handle || 'Vincular Steam'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => openEdit('steam_handle', 'Steam', profile?.steam_handle)}>
                                <Ionicons name="pencil" size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={[styles.editButton, { marginTop: 20, borderColor: theme.colors.error, backgroundColor: 'transparent' }]} onPress={handleSignOut}>
                    <Text style={[styles.editButtonText, { color: theme.colors.error }]}>Sair da Conta</Text>
                </TouchableOpacity>

                <View style={{ height: 50 }} />

            </ScrollView>

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                onSave={handleSaveField}
                field={editingField}
                label={editingLabel}
                initialValue={editingValue}
                multiline={editingMultiline}
            />
        </View>
    );
}


// ... Styles (I need to ensure I import EditProfileModal)

const styles = StyleSheet.create({
    // ... existing styles ...
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
    gameItem: {
        width: 80,
        alignItems: 'center',
        marginRight: 8,
    },
    gameIcon: {
        width: 60,
        height: 60,
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
    // Schedule Grid Styles
    scheduleGrid: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginTop: theme.spacing.sm,
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
        fontSize: 10,
        fontWeight: '600',
    },
    dayLabel: {
        color: theme.colors.text,
        fontWeight: '500',
        fontSize: 12,
    },
    periodButton: {
        width: '80%',
        height: 28,
        borderRadius: 14,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    periodButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
});
