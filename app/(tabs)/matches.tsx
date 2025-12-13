import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';

import RatingModal from '../../src/components/RatingModal';

export default function MatchesScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [ratingModalVisible, setRatingModalVisible] = useState(false);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Simple "Match" logic: Users I liked who also liked me
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

            const { data: mutualLikes } = await supabase
                .from('swipes')
                .select('swiper_id')
                .in('swiper_id', myLikedIds)
                .eq('swiped_id', session.user.id)
                .eq('is_like', true);

            if (!mutualLikes || mutualLikes.length === 0) {
                setMatches([]);
                return;
            }

            const matchIds = mutualLikes.map(l => l.swiper_id);

            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', matchIds);

            setMatches(profiles || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copiado!', `${label} copiado para a área de transferência.`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.matchItem} onPress={() => setSelectedMatch(item)}>
            <Image
                source={{ uri: item.avatar_url || 'https://via.placeholder.com/100' }}
                style={styles.avatar}
                contentFit="cover"
            />
            <View style={styles.info}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.discord_handle || 'Toque para ver IDs...'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

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
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedMatch}
                onRequestClose={() => setSelectedMatch(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Conectar-se</Text>
                            <TouchableOpacity onPress={() => setSelectedMatch(null)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.profileSummary}>
                            <Image
                                source={{ uri: selectedMatch?.avatar_url || 'https://via.placeholder.com/100' }}
                                style={styles.modalAvatar}
                            />
                            <Text style={styles.modalUsername}>{selectedMatch?.username}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>IDs de Plataforma</Text>
                        <View style={styles.idsContainer}>
                            {selectedMatch?.discord_handle ? (
                                <TouchableOpacity style={styles.idRow} onPress={() => copyToClipboard(selectedMatch.discord_handle, 'Discord')}>
                                    <Ionicons name="logo-discord" size={24} color="#5865F2" />
                                    <Text style={styles.idText}>{selectedMatch.discord_handle}</Text>
                                    <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}

                            {selectedMatch?.psn_handle ? (
                                <TouchableOpacity style={styles.idRow} onPress={() => copyToClipboard(selectedMatch.psn_handle, 'PSN')}>
                                    <Ionicons name="logo-playstation" size={24} color="#003087" />
                                    <Text style={styles.idText}>{selectedMatch.psn_handle}</Text>
                                    <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}

                            {selectedMatch?.xbox_handle ? (
                                <TouchableOpacity style={styles.idRow} onPress={() => copyToClipboard(selectedMatch.xbox_handle, 'Xbox')}>
                                    <Ionicons name="logo-xbox" size={24} color="#107C10" />
                                    <Text style={styles.idText}>{selectedMatch.xbox_handle}</Text>
                                    <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}

                            {selectedMatch?.steam_handle ? (
                                <TouchableOpacity style={styles.idRow} onPress={() => copyToClipboard(selectedMatch.steam_handle, 'Steam')}>
                                    <Ionicons name="logo-steam" size={24} color="#1b2838" />
                                    <Text style={styles.idText}>{selectedMatch.steam_handle}</Text>
                                    <Ionicons name="copy-outline" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}

                            {!selectedMatch?.discord_handle && !selectedMatch?.psn_handle && !selectedMatch?.xbox_handle && !selectedMatch?.steam_handle && (
                                <Text style={styles.emptyText}>Este usuário não cadastrou IDs de plataforma.</Text>
                            )}

                            <TouchableOpacity
                                style={styles.rateButton}
                                onPress={() => setRatingModalVisible(true)}
                            >
                                <Ionicons name="star" size={20} color="#FFF" />
                                <Text style={styles.rateButtonText}>Avaliar Jogador</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {selectedMatch && (
                <RatingModal
                    visible={ratingModalVisible}
                    onClose={() => setRatingModalVisible(false)}
                    ratedUserId={selectedMatch.id}
                    ratedUsername={selectedMatch.username}
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
        fontSize: 16,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: theme.spacing.xl,
        minHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    profileSummary: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    modalAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: theme.spacing.sm,
    },
    modalUsername: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
        textTransform: 'uppercase',
    },
    idsContainer: {
        gap: theme.spacing.md,
        paddingBottom: 40,
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
