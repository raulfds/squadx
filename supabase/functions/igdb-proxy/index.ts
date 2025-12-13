import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const IGDB_CLIENT_ID = Deno.env.get('IGDB_CLIENT_ID')
const IGDB_ACCESS_TOKEN = Deno.env.get('IGDB_ACCESS_TOKEN')

console.log("IGDB Proxy Function Loaded")

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', } })
    }

    try {
        const { query } = await req.json()

        if (!IGDB_CLIENT_ID || !IGDB_ACCESS_TOKEN) {
            throw new Error('Missing IGDB credentials')
        }

        const response = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': IGDB_CLIENT_ID,
                'Authorization': `Bearer ${IGDB_ACCESS_TOKEN}`,
                'Content-Type': 'text/plain',
            },
            body: `search "${query}"; fields name, cover.url, genres.name; limit 10;`,
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error("IGDB Error:", errorText);
            throw new Error(`IGDB API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json()

        // Process cover URLs (replace t_thumb with t_cover_big for better quality)
        const processedData = data.map((game: any) => ({
            ...game,
            cover_url: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null
        }));

        return new Response(
            JSON.stringify(processedData),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        )
    }
})
