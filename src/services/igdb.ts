
const CLIENT_ID = process.env.EXPO_PUBLIC_IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_IGDB_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiration: number = 0;

async function getAccessToken(): Promise<string> {
    if (accessToken && Date.now() < tokenExpiration) {
        return accessToken!;
    }

    try {
        const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
            method: 'POST',
        });

        console.log('IGDB Auth Status:', response.status);
        const text = await response.text();
        console.log('IGDB Auth Body:', text);
        const data = JSON.parse(text);
        if (data.access_token) {
            accessToken = data.access_token;
            // Set expiration slightly before actual expiry (expires_in is in seconds)
            tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000;
            return accessToken;
        } else {
            throw new Error('Failed to obtain access token');
        }
    } catch (error) {
        console.error('IGDB Auth Error:', error);
        throw error;
    }
}

export interface Game {
    id: number;
    name: string;
    genres?: { id: number; name: string }[];
    cover?: { id: number; url: string };
}

export async function searchGames(query: string): Promise<Game[]> {
    try {
        const token = await getAccessToken();

        const response = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': CLIENT_ID!,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain',
            },
            body: `search "${query}"; fields name, genres.name, cover.url; limit 10;`,
        });

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('IGDB Search Error:', error);
        return [];
    }
}
