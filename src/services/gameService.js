import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

/**
 * Service to interact with IGDB API via Vercel Proxy
 */
const BASE_URL = '/api/igdb';

// Helper to get API Key from Firestore
const getApiKeys = async () => {
    try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return {
                clientId: docSnap.data().igdbClientId,
                clientSecret: docSnap.data().igdbClientSecret
            };
        }
    } catch (error) {
        console.error("Error fetching API Key:", error);
    }
    return { clientId: null, clientSecret: null };
};

/**
 * Call local Vercel Proxy to talk to IGDB
 */
const fetchIGDB = async (endpoint, query) => {
    const keys = await getApiKeys();
    if (!keys.clientId || !keys.clientSecret) {
        toast.error("Faltan Credenciales de IGDB en Configuración");
        throw new Error("Credenciales IGDB no configuradas en Admin");
    }

    try {
        const response = await fetch('/api/igdb', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId: keys.clientId,
                clientSecret: keys.clientSecret,
                endpoint: endpoint,
                query: query
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("IGDB Proxy Error Body:", errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("IGDB Fetch Error:", error);
        toast.error(`Error de Conexión IGDB: ${error.message}`);
        throw error;
    }
};

/**
 * Helper: Fix IGDB Image URL (resize to big)
 */
const fixIgdbImage = (url) => {
    if (!url) return '';
    // url comes as "//images.igdb.com/igdb/image/upload/t_thumb/..."
    // we want "https://..." and "t_1080p" or "t_720p" or "t_cover_big"
    if (url.startsWith('//')) url = 'https:' + url;
    return url.replace('t_thumb', 't_1080p');
};

/**
 * Search for a game by title using IGDB
 * @param {string} query - Game title
 * @returns {Promise<Array>} List of games
 */
export const searchGame = async (query) => {
    try {
        // IGDB Query Language
        const igdbQuery = `
            search "${query}";
            fields name, cover.url, first_release_date;
            limit 10;
        `;

        const results = await fetchIGDB('games', igdbQuery);

        // Map to common format
        return results.map(game => ({
            id: game.id,
            name: game.name,
            released: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : '',
            background_image: fixIgdbImage(game.cover?.url) // Preview image
        }));
    } catch (error) {
        console.error("IGDB Search Error:", error);
        return [];
    }
};

/**
 * Get detailed game info from IGDB
 * @param {number} gameId 
 * @param {string} gameTitle - Legacy support, generally unused for IGDB direct
 * @returns {Promise<Object>} Game details
 */
export const getGameDetails = async (gameId, gameTitle = '') => {
    try {
        // Detailed query
        const igdbQuery = `
            fields name, summary, url, rating, first_release_date,
            cover.url, 
            genres.name, 
            platforms.name, 
            videos.video_id;
            where id = ${gameId};
        `;

        const results = await fetchIGDB('games', igdbQuery);
        if (!results || results.length === 0) return null;

        const data = results[0];

        // Extract Trailer (Find one with 'Trailer' in name? Or just first video?)
        // IGDB returns video_id which is the YouTube ID.
        let trailerUrl = '';
        if (data.videos && data.videos.length > 0) {
            // Just take the first one or logic to find "Trailer"
            trailerUrl = `https://www.youtube.com/watch?v=${data.videos[0].video_id}`;
        }

        return {
            description: data.summary || '',
            website: data.url,
            metacritic: data.rating ? Math.round(data.rating) : 0, // Converting 0-100 float to int
            released: data.first_release_date ? new Date(data.first_release_date * 1000).toISOString().split('T')[0] : null,
            background_image: fixIgdbImage(data.cover?.url),
            trailer: trailerUrl,
            genres: data.genres?.map(g => g.name) || [],
            platforms: data.platforms?.map(p => p.platform.name) || []
        };
    } catch (error) {
        console.error("IGDB Details Error:", error);
        return null;
    }
};

// Legacy Placeholder (Not used but kept for exports if checking)
export const searchYoutubeTrailer = async () => '';
