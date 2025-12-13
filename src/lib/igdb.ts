import { supabase } from './supabase';

export interface IGDBGame {
    id: number;
    name: string;
    cover?: {
        id: number;
        url: string;
    };
    genres?: {
        id: number;
        name: string;
    }[];
}

export const searchGames = async (query: string): Promise<IGDBGame[]> => {
    // IGDB Query syntax
    // We want name, cover url (replace t_thumb with t_cover_big if needed), and genres
    const body = `
        search "${query}";
        fields name, cover.url, genres.name;
        limit 10;
    `;

    const { data, error } = await supabase.functions.invoke('igdb-proxy', {
        body: {
            endpoint: 'games',
            body: body
        }
    });

    if (error) {
        console.error('IGDB Search Error:', error);
        throw error;
    }

    return data || [];
};
