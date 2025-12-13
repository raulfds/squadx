import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

interface GameSearchProps {
    onSelectGame: (game: any) => void;
}

export const GameSearch = ({ onSelectGame }: GameSearchProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearching(true);
        try {
            const { data, error } = await supabase.functions.invoke('igdb-proxy', {
                body: { query }
            });

            if (error) throw error;
            setResults(data || []);

        } catch (error) {
            console.error(error);
            // Fallback for demo/error
            // setResults([{ id: 1, name: 'Demo Game (API Error)', cover_url: null }]);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.resultItem} onPress={() => {
            onSelectGame({
                id: item.id.toString(), // Store as string to match potential UUID usage elsewhere or consisteny
                name: item.name,
                cover_url: item.cover_url,
                genres: item.genres?.map((g: any) => g.name).join(', ') // Combine genres into a string
            });
            setQuery('');
            setResults([]);
            setSearching(false);
        }}>
            <Image
                source={{ uri: item.cover_url || 'https://via.placeholder.com/60' }}
                style={styles.cover}
                contentFit="cover"
            />
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.genres && item.genres.length > 0 && (
                    <Text style={styles.genre}>{item.genres[0].name}</Text>
                )}
            </View>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Buscar jogos..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    {loading ? <ActivityIndicator color="#000" /> : <Ionicons name="search" size={20} color="#000" />}
                </TouchableOpacity>
            </View>

            {searching && (
                <View style={styles.resultsContainer}>
                    {results.length > 0 ? (
                        <FlatList
                            data={results}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderItem}
                            style={{ maxHeight: 200 }}
                            nestedScrollEnabled={true}
                        />
                    ) : (
                        !loading && <Text style={styles.emptyText}>Nenhum jogo encontrado.</Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.md,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchButton: {
        backgroundColor: theme.colors.primary,
        width: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsContainer: {
        marginTop: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 8,
        maxHeight: 220,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    cover: {
        width: 40,
        height: 50,
        borderRadius: 4,
        backgroundColor: '#333',
    },
    info: {
        flex: 1,
        marginLeft: 10,
    },
    name: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 14,
    },
    genre: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        padding: 16,
    }
});
