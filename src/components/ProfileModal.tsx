import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
    profile: any;
    reputation: any;
    games: any[];
    isMatch?: boolean;
    onRatePress?: () => void;
}

export default function ProfileModal({
    visible,
    onClose,
    profile,
    reputation,
    games,
    isMatch = false,
    onRatePress
}: ProfileModalProps) {
    if (!profile) return null;

    const copyToClipboard = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copiado!', `${label} copiado para a área de transferência.`);
    };

    const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const PERIODS = ['Manhã', 'Tarde', 'Noite'];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{profile.username}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalSubtitle}>
                        {profile.city} - {profile.state}
                        {typeof profile.distance_km === 'number' && (
                            ` • ${profile.distance_km.toFixed(1)} km`
                        )}
                    </Text>

                    {/* Full Profile Content */}
                    <FlatList
                        data={[]}
                        renderItem={() => null}
                        keyExtractor={() => "dummy"}
                        ListHeaderComponent={
                            <View>
                                <View style={{ position: 'relative' }}>
                                    {/* Photos Carousel */}
                                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
                                        {profile.photos?.length > 0 ? (
                                            profile.photos.map((photo: string, index: number) => (
                                                <Image key={index} source={{ uri: photo }} style={styles.carouselImage} contentFit="cover" />
                                            ))
                                        ) : (
                                            <Image source={{ uri: profile.avatar_url || 'https://via.placeholder.com/300' }} style={styles.carouselImage} contentFit="cover" />
                                        )}
                                    </ScrollView>

                                    {/* Rating Badge on Photo - Top Right */}
                                    {reputation && (
                                        <View style={styles.photoRatingBadge}>
                                            <Ionicons name="star" size={12} color="#000" />
                                            <Text style={styles.photoRatingText}>
                                                {((reputation.avg_respect + reputation.avg_communication + reputation.avg_humor + reputation.avg_collaboration) / 4).toFixed(1)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Info Section */}
                                <View style={styles.infoSection}>
                                    {/* Bio */}
                                    <Text style={styles.bioText}>{profile.bio || 'Sem bio...'}</Text>

                                    {/* Reputation */}
                                    {reputation && (
                                        <View style={styles.sectionContainer}>
                                            <Text style={styles.sectionTitle}>Reputação</Text>
                                            <View style={styles.reputationGrid}>
                                                <View style={styles.repItem}>
                                                    <Text style={styles.repLabel}>Respeito</Text>
                                                    <Text style={styles.repValue}>{reputation.avg_respect ?? '-'}</Text>
                                                </View>
                                                <View style={styles.repItem}>
                                                    <Text style={styles.repLabel}>Comum.</Text>
                                                    <Text style={styles.repValue}>{reputation.avg_communication ?? '-'}</Text>
                                                </View>
                                                <View style={styles.repItem}>
                                                    <Text style={styles.repLabel}>Humor</Text>
                                                    <Text style={styles.repValue}>{reputation.avg_humor ?? '-'}</Text>
                                                </View>
                                                <View style={styles.repItem}>
                                                    <Text style={styles.repLabel}>Colab.</Text>
                                                    <Text style={styles.repValue}>{reputation.avg_collaboration ?? '-'}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                    {/* Games */}
                                    {(games?.length > 0 || profile.game_genres?.length > 0) && (
                                        <View style={styles.sectionContainer}>
                                            <Text style={styles.sectionTitle}>Jogos & Categorias</Text>
                                            {games?.length > 0 && (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginBottom: 8 }}>
                                                    {games.map((g: any) => (
                                                        <View key={g.game_id || g.id} style={styles.gameItem}>
                                                            <Image source={{ uri: g.game_cover_url }} style={styles.gameIcon} />
                                                            <Text style={styles.gameName} numberOfLines={1}>{g.game_name || g.name}</Text>
                                                        </View>
                                                    ))}
                                                </ScrollView>
                                            )}
                                            <View style={styles.chipRow}>
                                                {profile.game_genres?.map((g: string) => (
                                                    <View key={g} style={styles.chip}><Text style={styles.chipText}>{g}</Text></View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Availability */}
                                    <View style={styles.sectionContainer}>
                                        <Text style={styles.sectionTitle}>Disponibilidade</Text>
                                        <View style={styles.scheduleGrid}>
                                            <View style={styles.scheduleRow}>
                                                <View style={[styles.scheduleCell, { flex: 1.5 }]} />
                                                {PERIODS.map(p => <View key={p} style={styles.scheduleCell}><Text style={styles.scheduleHeader}>{p}</Text></View>)}
                                            </View>
                                            {DAYS.map(day => (
                                                <View key={day} style={styles.scheduleRow}>
                                                    <View style={[styles.scheduleCell, { flex: 1.5, alignItems: 'flex-start' }]}><Text style={styles.dayLabel}>{day.slice(0, 3)}</Text></View>
                                                    {PERIODS.map(period => {
                                                        const isAvailable = profile.availability?.[day]?.includes(period);
                                                        return (
                                                            <View key={period} style={styles.scheduleCell}>
                                                                <View style={[styles.periodButton, isAvailable && styles.periodButtonSelected]}>
                                                                    {isAvailable && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* PLATFORMS (Only if isMatch) */}
                                    {isMatch && (
                                        <>
                                            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Plataformas</Text>
                                            <View style={styles.idsContainer}>
                                                {profile.discord_handle ? (
                                                    <TouchableOpacity style={styles.idRow} onPress={() => copyToClipboard(profile.discord_handle, 'Discord')}>
                                                        <Ionicons name="logo-discord" size={24} color="#5865F2" />
                                                        <Text style={styles.idText}>{profile.discord_handle}</Text>
                                                        <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
                                                    </TouchableOpacity>
                                                ) : null}
                                                {profile.psn_handle ? (
                                                    <TouchableOpacity style={styles.idRow} onPress={() => copyToClipboard(profile.psn_handle, 'PSN')}>
                                                        <Ionicons name="logo-playstation" size={24} color="#003087" />
                                                        <Text style={styles.idText}>{profile.psn_handle}</Text>
                                                        <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
                                                    </TouchableOpacity>
                                                ) : null}
                                                {profile.xbox_handle ? (
                                                    <TouchableOpacity style={styles.idRow} onPress={() => copyToClipboard(profile.xbox_handle, 'Xbox')}>
                                                        <Ionicons name="logo-xbox" size={24} color="#107C10" />
                                                        <Text style={styles.idText}>{profile.xbox_handle}</Text>
                                                        <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
                                                    </TouchableOpacity>
                                                ) : null}
                                                {profile.steam_handle ? (
                                                    <TouchableOpacity style={styles.idRow} onPress={() => copyToClipboard(profile.steam_handle, 'Steam')}>
                                                        <Ionicons name="logo-steam" size={24} color="#1b2838" />
                                                        <Text style={styles.idText}>{profile.steam_handle}</Text>
                                                        <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
                                                    </TouchableOpacity>
                                                ) : null}

                                                {!profile.discord_handle && !profile.psn_handle && !profile.xbox_handle && !profile.steam_handle && (
                                                    <Text style={styles.emptyText}>Sem IDs visíveis.</Text>
                                                )}

                                                {onRatePress && (
                                                    <TouchableOpacity style={styles.rateButton} onPress={onRatePress}>
                                                        <Ionicons name="star" size={20} color="#FFF" />
                                                        <Text style={styles.rateButtonText}>Avaliar Jogador</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        height: '90%',
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
        width: 400,
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
    periodButton: {
        width: '80%',
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    periodButtonSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
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
    emptyText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
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
    },
    photoRatingBadge: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
        zIndex: 10,
    },
    photoRatingText: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 14,
    },
});
