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
    photos?: string[];
    discord_handle?: string;
    psn_handle?: string;
    xbox_handle?: string;
    steam_handle?: string;
    game_genres?: string[];
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

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    username: data.username,
                    full_name: data.full_name,
                    birth_date: data.birth_date, // ensure format YYYY-MM-DD
                    gender: data.gender,
                    bio: data.bio,
                    city: data.city,
                    state: data.state,
                    photos: data.photos,
                    discord_handle: data.discord_handle,
                    psn_handle: data.psn_handle,
                    xbox_handle: data.xbox_handle,
                    steam_handle: data.steam_handle,
                    game_genres: data.game_genres,
                    // role_preferences: data.role_preferences, // Assume column added or mapped
                    availability: data.availability,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            // Could also update user metadata to flag onboarding_completed: true
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
