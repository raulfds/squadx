import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FilterModal from '../../src/components/FilterModal';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';
import { Filters } from '../../src/types';

const { width } = Dimensions.get('window');

// ... (existing code for ExploreScreen state and logic is preserved, we are just fixing imports and render initially)

export default function ExploreScreen() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [currentRating, setCurrentRating] = useState<any>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    minRespect: 1,
    minCommunication: 1,
    minHumor: 1,
    minCollaboration: 1
  });

  useEffect(() => {
    fetchProfiles();
  }, [filters]);

  useEffect(() => {
    if (profiles[currentProfileIndex]) {
      fetchRating(profiles[currentProfileIndex].id);
    }
  }, [currentProfileIndex, profiles]);

  const fetchRating = async (userId: string) => {
    const { data } = await supabase
      .from('user_rating_averages')
      .select('*')
      .eq('rated_id', userId)
      .single();
    setCurrentRating(data);
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_profiles_to_explore', {
        p_limit: 10,
        min_respect: filters.minRespect,
        min_communication: filters.minCommunication,
        min_humor: filters.minHumor,
        min_collaboration: filters.minCollaboration
      });
      if (error) throw error;
      setProfiles(data || []);
      setCurrentProfileIndex(0);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar perfis.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (isLike: boolean) => {
    const profile = profiles[currentProfileIndex];
    if (!profile) return;

    // Optimistic update: Move to next card immediately
    const nextIndex = currentProfileIndex + 1;
    setCurrentProfileIndex(nextIndex);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Save Swipe
      const { error } = await supabase.from('swipes').insert({
        swiper_id: session.user.id,
        swiped_id: profile.id,
        is_like: isLike
      });

      if (error) {
        console.error('Swipe Error', error);
        // Ideally revert optimistic update here if critical
      }

      // Check for Match if it was a Like
      if (isLike) {
        const { data: mutualSwipe } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', profile.id)
          .eq('swiped_id', session.user.id)
          .eq('is_like', true)
          .single();

        if (mutualSwipe) {
          setMatchedProfile(profile);
          setMatchModalVisible(true);
        }
      }

      // If we ran out of profiles, fetch more
      if (nextIndex >= profiles.length) {
        fetchProfiles();
      }

    } catch (error) {
      console.error(error);
    }
  };

  const renderCard = () => {
    const profile = profiles[currentProfileIndex];
    if (!profile) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Sem mais perfis por enquanto...</Text>
          <TouchableOpacity onPress={fetchProfiles} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#FFF" />
            <Text style={styles.refreshText}>Recarregar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: profile.avatar_url || 'https://via.placeholder.com/400x500' }}
          style={styles.cardImage}
          contentFit="cover"
        />

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>{profile.username}</Text>
            {!!currentRating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#000" />
                <Text style={styles.ratingText}>
                  {((currentRating.avg_respect + currentRating.avg_communication + currentRating.avg_humor + currentRating.avg_collaboration) / 4).toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {(profile.city && profile.state) && (
            <Text style={styles.cardLocation}>{profile.city} - {profile.state}</Text>
          )}

          {!!currentRating && (
            <View style={styles.attributesRow}>
              <View style={styles.attributeTag}>
                <Text style={styles.attributeLabel}>🤝 {currentRating.avg_respect || '-'}</Text>
              </View>
              <View style={styles.attributeTag}>
                <Text style={styles.attributeLabel}>🗣️ {currentRating.avg_communication || '-'}</Text>
              </View>
              <View style={styles.attributeTag}>
                <Text style={styles.attributeLabel}>😂 {currentRating.avg_humor || '-'}</Text>
              </View>
              <View style={styles.attributeTag}>
                <Text style={styles.attributeLabel}>🧠 {currentRating.avg_collaboration || '-'}</Text>
              </View>
            </View>
          )}
          <Text style={styles.cardBio} numberOfLines={3}>{profile.bio || 'Sem bio...'}</Text>
        </View>
      </View>
    );
  };

  if (loading && profiles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="options" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        {renderCard()}
      </View>

      {profiles[currentProfileIndex] && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.passButton]} onPress={() => handleSwipe(false)}>
            <Ionicons name="close" size={32} color="#eb4034" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.likeButton]} onPress={() => handleSwipe(true)}>
            <Ionicons name="heart" size={32} color="#04d361" />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={matchModalVisible}
        onRequestClose={() => setMatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>IT'S A MATCH!</Text>
            <Text style={styles.modalSubtitle}>Você e {matchedProfile?.username} se curtiram.</Text>

            <View style={styles.matchAvatars}>
              <View style={styles.avatarPlaceholder} />
              <Ionicons name="heart" size={24} color={theme.colors.primary} style={{ marginHorizontal: 16 }} />
              <Image
                source={{ uri: matchedProfile?.avatar_url || 'https://via.placeholder.com/100' }}
                style={styles.modalAvatar}
              />
            </View>

            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                setMatchModalVisible(false);
                // Navigate to chat (TODO)
                Alert.alert('Chat', 'Funcionalidade de chat em breve!');
              }}
            >
              <Text style={styles.chatButtonText}>Mandar Oi</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMatchModalVisible(false)}>
              <Text style={styles.closeText}>Continuar explorando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: 'Inter',
  },
  filterButton: {
    position: 'absolute',
    right: theme.spacing.md,
    top: theme.spacing.md,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  card: {
    width: width * 0.9,
    height: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardImage: {
    width: '100%',
    height: '70%',
    backgroundColor: '#333',
  },
  cardInfo: {
    padding: theme.spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 14,
  },
  cardLocation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  attributesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  attributeTag: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attributeLabel: {
    fontSize: 12,
    color: theme.colors.text,
  },
  cardBio: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: theme.spacing.xl,
    width: '100%',
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passButton: {

  },
  likeButton: {
    borderColor: theme.colors.secondary,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 8,
    gap: 8,
  },
  refreshText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  modalSubtitle: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  matchAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary, // Current user placeholder
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  chatButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl * 1.5,
    borderRadius: 30,
    marginBottom: theme.spacing.md,
  },
  chatButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  }
});
