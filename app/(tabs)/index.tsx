import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterModal from '../../src/components/FilterModal';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/theme';
import { Filters } from '../../src/types';

const { width } = Dimensions.get('window');

// ... (existing code for ExploreScreen state and logic is preserved, we are just fixing imports and render initially)

// ... (existing code)

const SWIPE_THRESHOLD = width * 0.25;

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
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    fetchMyProfile();
  }, []);

  const fetchMyProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setMyProfile(data);
    }
  };

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
        p_common_games: filters.commonGames,
        p_max_distance_km: filters.maxDistanceKm
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
      setProfiles(data || []);
      setCurrentProfileIndex(0);
      translateX.value = 0;
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

  // Animation & Gesture Logic
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const performSwipe = (isLike: boolean) => {
    'worklet';
    const destination = isLike ? width + 100 : -width - 100;
    translateX.value = withTiming(destination, {}, () => {
      runOnJS(handleSwipe)(isLike);
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onBegin(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX + contextX.value;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        performSwipe(true);
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        performSwipe(false);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-10, 0, 10],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` }
      ],
    };
  });

  // Reset position when index changes
  useEffect(() => {
    translateX.value = 0;
  }, [currentProfileIndex]);

  // Manual swipe trigger
  const manualSwipe = (isLike: boolean) => {
    const destination = isLike ? width + 100 : -width - 100;
    translateX.value = withTiming(destination, {}, () => {
      runOnJS(handleSwipe)(isLike);
    });
  };



  if (loading && profiles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  /* ... existing logic ... */

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explorar</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="options" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {loading && profiles.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : !profiles[currentProfileIndex] ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Sem mais perfis por enquanto...</Text>
            <TouchableOpacity onPress={fetchProfiles} style={styles.refreshButton}>
              <Ionicons name="refresh" size={24} color="#FFF" />
              <Text style={styles.refreshText}>Recarregar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                  {/* Image Section */}
                  <View style={{ width: width, height: 500, position: 'relative' }}>
                    <Image
                      source={{ uri: (profiles[currentProfileIndex].photos && profiles[currentProfileIndex].photos.length > 0) ? profiles[currentProfileIndex].photos[0] : (profiles[currentProfileIndex].avatar_url || 'https://via.placeholder.com/400x500') }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <View style={styles.imageOverlayGradient} />

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
                  </View>

                  <View style={styles.contentContainer}>
                    {/* Header: Name, Age */}
                    <View style={styles.headerRow}>
                      <View>
                        <Text style={styles.cardName}>{profiles[currentProfileIndex].username}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {profiles[currentProfileIndex].birth_date && (
                            <Text style={styles.cardAge}>
                              {new Date().getFullYear() - new Date(profiles[currentProfileIndex].birth_date).getFullYear()} anos
                            </Text>
                          )}
                          {profiles[currentProfileIndex].birth_date && profiles[currentProfileIndex].gender && (
                            <Text style={styles.cardAge}> • </Text>
                          )}
                          {profiles[currentProfileIndex].gender && (
                            <Text style={styles.cardAge}>
                              {profiles[currentProfileIndex].gender}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {(profiles[currentProfileIndex].city && profiles[currentProfileIndex].state) && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-sharp" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.cardLocation}>{profiles[currentProfileIndex].city} - {profiles[currentProfileIndex].state}</Text>
                        {typeof profiles[currentProfileIndex].distance_km === 'number' && (
                          <Text style={styles.cardLocation}> • {profiles[currentProfileIndex].distance_km.toFixed(1)} km</Text>
                        )}
                      </View>
                    )}

                    {/* Bio */}
                    {profiles[currentProfileIndex].bio && (
                      <Text style={styles.cardBio}>{profiles[currentProfileIndex].bio}</Text>
                    )}


                    {/* Reputation Detail */}
                    {!!currentRating && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Reputação</Text>
                        <View style={styles.reputationGrid}>
                          <View style={styles.repItem}>
                            <View style={[styles.repIcon, { backgroundColor: '#4CB5F5' }]}>
                              <Ionicons name="thumbs-up" size={16} color="#FFF" />
                            </View>
                            <Text style={styles.repValue}>{currentRating.avg_respect}</Text>
                            <Text style={styles.repLabel}>Respeito</Text>
                          </View>
                          <View style={styles.repItem}>
                            <View style={[styles.repIcon, { backgroundColor: '#B7B8B6' }]}>
                              <Ionicons name="chatbubbles" size={16} color="#FFF" />
                            </View>
                            <Text style={styles.repValue}>{currentRating.avg_communication}</Text>
                            <Text style={styles.repLabel}>Comunicação</Text>
                          </View>
                          <View style={styles.repItem}>
                            <View style={[styles.repIcon, { backgroundColor: '#FFD93E' }]}>
                              <Ionicons name="happy" size={16} color="#FFF" />
                            </View>
                            <Text style={styles.repValue}>{currentRating.avg_humor}</Text>
                            <Text style={styles.repLabel}>Humor</Text>
                          </View>
                          <View style={styles.repItem}>
                            <View style={[styles.repIcon, { backgroundColor: '#6F00FF' }]}>
                              <Ionicons name="people" size={16} color="#FFF" />
                            </View>
                            <Text style={styles.repValue}>{currentRating.avg_collaboration}</Text>
                            <Text style={styles.repLabel}>Colaboração</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Games */}
                    {(currentGames.length > 0 || (profiles[currentProfileIndex].game_genres && profiles[currentProfileIndex].game_genres.length > 0)) && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Jogos & Categorias</Text>

                        {/* Games Icons */}
                        {currentGames.length > 0 && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginBottom: 12 }}>
                            {currentGames.map((g: any) => (
                              <View key={g.game_id || g.id} style={styles.gameItem}>
                                {g.game_cover_url ? (
                                  <Image source={{ uri: g.game_cover_url }} style={styles.gameIcon} />
                                ) : (
                                  <View style={[styles.gameIcon, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="game-controller" size={20} color="#999" />
                                  </View>
                                )}
                                <Text style={styles.gameName} numberOfLines={1}>{g.game_name || g.name}</Text>
                              </View>
                            ))}
                          </ScrollView>
                        )}

                        {/* Genre Chips */}
                        {profiles[currentProfileIndex].game_genres && profiles[currentProfileIndex].game_genres.length > 0 && (
                          <View style={styles.chipRow}>
                            {profiles[currentProfileIndex].game_genres.map((g: string) => (
                              <View key={g} style={styles.chip}>
                                <Text style={styles.chipText}>{g}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Availability Grid (Read Only - match Profile style) */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Disponibilidade</Text>
                      <View style={styles.scheduleGrid}>
                        <View style={styles.scheduleRow}>
                          <View style={[styles.scheduleCell, { flex: 1.5 }]} />
                          {['Manhã', 'Tarde', 'Noite'].map(p => (
                            <View key={p} style={styles.scheduleCell}>
                              <Text style={styles.scheduleHeader}>{p}</Text>
                            </View>
                          ))}
                        </View>
                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                          <View key={day} style={styles.scheduleRow}>
                            <View style={[styles.scheduleCell, { flex: 1.5, alignItems: 'flex-start', paddingLeft: 4 }]}>
                              <Text style={styles.dayLabel}>{day.slice(0, 3)}</Text>
                            </View>
                            {['Manhã', 'Tarde', 'Noite'].map(period => {
                              const isAvailable = profiles[currentProfileIndex].availability?.[day]?.includes(period);
                              return (
                                <View key={`${day}-${period}`} style={styles.scheduleCell}>
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

                  </View>
                </ScrollView>
              </Animated.View>
            </GestureDetector>

            {/* Fixed Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={[styles.actionButton, styles.passButton]} onPress={() => manualSwipe(false)}>
                <MaterialCommunityIcons name="controller-off" size={32} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.likeButton]} onPress={() => manualSwipe(true)}>
                <Ionicons name="game-controller" size={42} color="#ff005c" />
              </TouchableOpacity>
            </View>
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
              <Text style={styles.modalTitle}>DEU MATCH!</Text>
              <Text style={styles.modalSubtitle}>Você e {matchedProfile?.username} se curtiram.</Text>

              <View style={styles.matchAvatars}>
                <Image
                  source={{ uri: (myProfile?.photos && myProfile.photos.length > 0) ? myProfile.photos[0] : (myProfile?.avatar_url || 'https://via.placeholder.com/100') }}
                  style={[styles.modalAvatar, { borderColor: theme.colors.primary }]}
                />
                <Ionicons name="game-controller" size={24} color="#ff005c" style={{ marginHorizontal: 16 }} />
                <Image
                  source={{ uri: (matchedProfile?.photos && matchedProfile.photos.length > 0) ? matchedProfile.photos[0] : (matchedProfile?.avatar_url || 'https://via.placeholder.com/100') }}
                  style={styles.modalAvatar}
                />
              </View>

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
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          filters={filters}
          onApply={setFilters}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
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
    backgroundColor: theme.colors.background,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
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
  contentContainer: {
    padding: theme.spacing.lg,
  },
  imageOverlayGradient: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 100,
    // Linear gradient simulation or removal if not needed,
    // but here we just leave it transparent or update if we had expo-linear-gradient
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    marginTop: 10
  },
  cardName: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text,
  },
  cardAge: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  cardLocation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  cardBio: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  /* Sections */
  section: {
    marginBottom: 24,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  /* Reputation Grid */
  reputationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
  },
  repItem: {
    alignItems: 'center',
    flex: 1
  },
  repIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  repLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  repValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  /* Games */
  gameItem: {
    width: 70,
    alignItems: 'center',
    marginRight: 8,
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: theme.colors.surface,
  },
  gameName: {
    color: theme.colors.text,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  /* Availability / Schedule */
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

  /* Actions */
  actionsContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 40
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    borderColor: '#eb4034',
    borderWidth: 4,
  },
  likeButton: {
    borderColor: '#04d361',
    borderWidth: 4,
    backgroundColor: theme.colors.surface,
    elevation: 10,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    fontSize: 16
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
  // Modal... 
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
