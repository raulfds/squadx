import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define the shape of our onboarding data
export interface OnboardingData {
    username?: string;
    full_name?: string;
    birth_date?: string;
    gender?: string;
    bio?: string;
    city?: string;
    state?: string;
    latitude?: number | null;
    longitude?: number | null;
    cep?: string;
    photos?: string[];
    discord_handle?: string;
    psn_handle?: string;
    xbox_handle?: string;
    steam_handle?: string;
    game_genres?: string[];
    games?: { id: number; name: string; genres?: { id: number; name: string }[]; cover?: { id: number; url: string } }[];
    role_preferences?: string[];
    availability?: any; // JSON structure for schedule
}

type OnboardingContextType = {
    data: OnboardingData;
    updateData: (newData: Partial<OnboardingData>) => void;
    submitProfile: () => Promise<void>;
    loading: boolean;
};

const OnboardingContext = createContext<OnboardingContextType>({
    data: {},
    updateData: () => { },
    submitProfile: async () => { },
    loading: false,
});

export const useOnboarding = () => useContext(OnboardingContext);

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
    const [data, setData] = useState<OnboardingData>({ photos: [] });
    const [loading, setLoading] = useState(false);

    const updateData = (newData: Partial<OnboardingData>) => {
        setData((prev) => ({ ...prev, ...newData }));
    };

    const submitProfile = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            // 1. Upsert Profile Data
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    username: data.username,
                    full_name: data.full_name,
                    birth_date: data.birth_date,
                    gender: data.gender,
                    bio: data.bio,
                    city: data.city,
                    state: data.state,
                    cep: data.cep,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    photos: data.photos,
                    discord_handle: data.discord_handle,
                    psn_handle: data.psn_handle,
                    xbox_handle: data.xbox_handle,
                    steam_handle: data.steam_handle,
                    game_genres: data.game_genres,
                    availability: data.availability,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) throw profileError;

            // 2. Sync Games to user_favorites if games data is present
            if (data.games) {
                // Fetch existing favorites
                const { data: existingFavorites } = await supabase
                    .from('user_favorites')
                    .select('game_id')
                    .eq('user_id', session.user.id);

                const existingIds = existingFavorites?.map(f => f.game_id) || [];
                const newIds = data.games.map(g => g.id.toString());

                // Determine additions and removals
                const toAdd = data.games.filter(g => !existingIds.includes(g.id.toString()));
                const toRemove = existingIds.filter(id => !newIds.includes(id));

                // Insert new games
                if (toAdd.length > 0) {
                    const formattedAdds = toAdd.map(g => ({
                        user_id: session.user.id,
                        game_id: g.id.toString(),
                        game_name: g.name,
                        game_cover_url: g.cover?.url ? `https:${g.cover.url}` : null,
                        game_genres: g.genres?.map(gen => gen.name).join(', ') // Store as string for reference
                    }));

                    const { error: addError } = await supabase
                        .from('user_favorites')
                        .insert(formattedAdds);

                    if (addError) console.error('Error adding games:', addError);
                }

                // Remove deleted games
                if (toRemove.length > 0) {
                    const { error: removeError } = await supabase
                        .from('user_favorites')
                        .delete()
                        .eq('user_id', session.user.id)
                        .in('game_id', toRemove);

                    if (removeError) console.error('Error removing games:', removeError);
                }
            }

        } catch (error) {
            console.error('Error submitting profile:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingContext.Provider value={{ data, updateData, submitProfile, loading }}>
            {children}
        </OnboardingContext.Provider>
    );
};
