import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterModal from '../../src/components/FilterModal';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';
import { Filters } from '../../src/types';

const { width } = Dimensions.get('window');

// ... (existing code for ExploreScreen state and logic is preserved, we are just fixing imports and render initially)

export default function ExploreScreen() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
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

  const [currentGames, setCurrentGames] = useState<any[]>([]);

  useEffect(() => {
    if (profiles[currentProfileIndex]) {
      fetchProfileDetails(profiles[currentProfileIndex].id);
    }
  }, [currentProfileIndex, profiles]);

  const fetchProfileDetails = async (userId: string) => {
    // Fetch Ratings
    const { data: ratingData } = await supabase
      .from('user_rating_averages')
      .select('*')
      .eq('rated_id', userId)
      .single();
    setCurrentRating(ratingData);

    // Fetch Games
    const { data: gamesData } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId);
    setCurrentGames(gamesData || []);
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      // 1. Try with current filters
      let { data, error } = await supabase.rpc('get_profiles_to_explore', {
        p_limit: 10,
        min_respect: filters.minRespect,
        min_communication: filters.minCommunication,
        min_humor: filters.minHumor,
        min_collaboration: filters.minCollaboration,
        p_gender: filters.gender,
        p_min_age: filters.minAge,
        p_max_age: filters.maxAge,
        p_same_location: filters.sameLocation,
        p_same_platform: filters.samePlatform,
        p_common_games: filters.commonGames
      });

      if (error) throw error;

      // 2. Fallback logic
      if (!data || data.length === 0) {
        // Check if we have active filters (assuming 1 is default/min)
        const hasFilters = filters.minRespect > 1 ||
          filters.minCommunication > 1 ||
          filters.minHumor > 1 ||
          filters.minCollaboration > 1;

        if (hasFilters) {
          console.log('No matches with filters, trying fallback...');
          const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_profiles_to_explore', {
            p_limit: 10,
            min_respect: 1,
            min_communication: 1,
            min_humor: 1,
            min_collaboration: 1
          });

          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            data = fallbackData;
            Alert.alert('Sem resultados exatos', 'Não encontramos ninguém com seus filtros específicos, mas dê uma chance a estas pessoas!');
          }
        }
      }

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

    const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const PERIODS = ['Manhã', 'Tarde', 'Noite'];

    return (
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setProfileModalVisible(true)} style={{ width: '100%', height: '65%', position: 'relative' }}>
          <Image
            source={{ uri: (profile.photos && profile.photos.length > 0) ? profile.photos[0] : (profile.avatar_url || 'https://via.placeholder.com/400x500') }}
            style={{ width: '100%', height: '100%', backgroundColor: '#333' }}
            contentFit="cover"
          />
          {/* Rating Badge on Photo */}
          <View style={styles.photoRatingBadge}>
            <Ionicons name="star" size={12} color="#000" />
            <Text style={styles.photoRatingText}>
              {currentRating
                ? ((currentRating.avg_respect + currentRating.avg_communication + currentRating.avg_humor + currentRating.avg_collaboration) / 4).toFixed(1)
                : 'Novo'
              }
            </Text>
          </View>
        </TouchableOpacity>

        <ScrollView style={styles.cardInfo} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {/* Scroll Hint */}
          <View style={styles.scrollHintContainer}>
            <Ionicons name="chevron-up" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.scrollHintText}>Detalhes</Text>
          </View>
          {/* Header: Name, Age */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.cardName}>{profile.username}</Text>
              {profile.birth_date && (
                <Text style={styles.cardAge}>
                  {new Date().getFullYear() - new Date(profile.birth_date).getFullYear()} anos
                </Text>
              )}
            </View>
          </View>

          {(profile.city && profile.state) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.cardLocation}>{profile.city} - {profile.state}</Text>
            </View>
          )}

          {/* Bio */}
          {profile.bio && (
            <Text style={styles.cardBio}>{profile.bio}</Text>
          )}

          {/* Reputation Detail */}
          {!!currentRating && (
            <View style={styles.reputationSection}>
              <Text style={styles.sectionTitle}>Reputação</Text>
              <View style={styles.reputationGrid}>
                <View style={styles.repItem}>
                  <Text style={styles.repLabel}>🤝 Respeito</Text>
                  <Text style={styles.repValue}>{currentRating.avg_respect}</Text>
                </View>
                <View style={styles.repItem}>
                  <Text style={styles.repLabel}>🗣️ Comum.</Text>
                  <Text style={styles.repValue}>{currentRating.avg_communication}</Text>
                </View>
                <View style={styles.repItem}>
                  <Text style={styles.repLabel}>😂 Humor</Text>
                  <Text style={styles.repValue}>{currentRating.avg_humor}</Text>
                </View>
                <View style={styles.repItem}>
                  <Text style={styles.repLabel}>🧠 Colab.</Text>
                  <Text style={styles.repValue}>{currentRating.avg_collaboration}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Games */}
          {(currentGames.length > 0 || (profile.game_genres && profile.game_genres.length > 0)) && (
            <View style={styles.gamesSection}>
              <Text style={styles.sectionTitle}>Jogos & Categorias</Text>

              {/* Games Icons */}
              {currentGames.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginBottom: 8 }}>
                  {currentGames.map((g: any) => (
                    <View key={g.game_id || g.id} style={styles.gameItem}>
                      {g.game_cover_url ? (
                        <Image source={{ uri: g.game_cover_url }} style={styles.gameIcon} />
                      ) : (
                        <View style={[styles.gameIcon, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="game-controller" size={20} color="#666" />
                        </View>
                      )}
                      <Text style={styles.gameName} numberOfLines={1}>{g.game_name || g.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Genre Chips */}
              {profile.game_genres && profile.game_genres.length > 0 && (
                <View style={styles.chipRow}>
                  {profile.game_genres.map((g: string) => (
                    <View key={g} style={styles.chip}>
                      <Text style={styles.chipText}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Availability Grid (Read Only) */}
          <View style={styles.availabilitySection}>
            <Text style={styles.sectionTitle}>Disponibilidade</Text>
            <View style={styles.scheduleGrid}>
              {/* Header */}
              <View style={styles.scheduleRow}>
                <View style={[styles.scheduleCell, { flex: 1.5 }]} />
                {PERIODS.map(p => (
                  <View key={p} style={styles.scheduleCell}>
                    <Text style={styles.scheduleHeader}>{p[0]}</Text>
                  </View>
                ))}
              </View>
              {/* Days */}
              {DAYS.map(day => (
                <View key={day} style={styles.scheduleRow}>
                  <View style={[styles.scheduleCell, { flex: 1.5, alignItems: 'flex-start' }]}>
                    <Text style={styles.dayLabel}>{day.slice(0, 3)}</Text>
                  </View>
                  {PERIODS.map(period => {
                    const isAvailable = profile.availability?.[day]?.includes(period);
                    return (
                      <View key={`${day}-${period}`} style={styles.scheduleCell}>
                        <View style={[styles.dot, isAvailable && styles.dotActive]} />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

        </ScrollView>
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
    paddingVertical: theme.spacing.sm,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
  },
  overlayText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollHintContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scrollHintText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: -4,
  },
  card: {
    width: width * 0.95,
    height: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoRatingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  photoRatingText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 12,
  },
  // cardImage style removed from here as it is inline now or can be redefined if needed for cleanliness
  cardInfo: {
    flex: 1,
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameRow: {
    // Deprecated in new layout but handled above
  },
  cardName: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.text,
  },
  cardAge: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  ratingText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  cardLocation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  cardBio: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  /* Reputation */
  reputationSection: {
    marginBottom: 16,
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 8,
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
  /* Games */
  gamesSection: {
    marginBottom: 16,
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
    backgroundColor: theme.colors.background,
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
  /* Availability */
  availabilitySection: {
    marginBottom: 16,
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

  /* Actions */
  actionsContainer: {
    position: 'absolute',
    bottom: 30, // Floats over provided space
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '80%',
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
    // defaults
  },
  likeButton: {
    borderColor: theme.colors.secondary,
    backgroundColor: '#1E1E1E',
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
  // Modal... (existing modal styles below)
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
