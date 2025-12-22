import { db } from '../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

/**
 * Service to interact with IGDB API via Vercel Proxy
 * Includes Smart Caching in Firestore
 */
const BASE_URL = '/api/igdb';

// Cache Duration: 30 Days (in milliseconds)
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000;

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

// --- CACHE HELPERS ---

const checkCache = async (cacheId) => {
    try {
        const docRef = doc(db, "api_cache", cacheId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const now = Date.now();
            const cachedTime = data.updatedAt?.toMillis() || 0;
            // Check if valid (not older than 30 days)
            if (now - cachedTime < CACHE_DURATION) {
                console.log(`[CACHE HIT] ${cacheId}`);
                return data.payload;
            }
        }
    } catch (err) {
        console.warn("Cache check failed", err);
    }
    return null;
};

const saveToCache = async (cacheId, payload) => {
    try {
        await setDoc(doc(db, "api_cache", cacheId), {
            payload,
            updatedAt: serverTimestamp()
        });
    } catch (err) {
        console.warn("Cache save failed", err);
    }
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
    if (url.startsWith('//')) url = 'https:' + url;
    return url.replace('t_thumb', 't_1080p');
};

/**
 * Search for a game by title using IGDB (Cached)
 */
export const searchGame = async (query) => {
    // Sanitize key for Firestore doc ID restrictions
    const safeQuery = query.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const cacheKey = `search_${safeQuery}`;

    // 1. Check Cache
    const cached = await checkCache(cacheKey);
    if (cached) return cached;

    try {
        // IGDB Query Language
        const igdbQuery = `
            search "${query}";
            fields name, cover.url, first_release_date;
            limit 10;
        `;

        const results = await fetchIGDB('games', igdbQuery);

        // Map to common format
        const mappedResults = results.map(game => ({
            id: game.id,
            name: game.name,
            released: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : '',
            background_image: fixIgdbImage(game.cover?.url)
        }));

        // 2. Save Cache (Only if results found)
        if (mappedResults.length > 0) {
            await saveToCache(cacheKey, mappedResults);
        }

        return mappedResults;
    } catch (error) {
        console.error("IGDB Search Error:", error);
        return [];
    }
};

/**
 * Get detailed game info from IGDB (Cached)
 */
export const getGameDetails = async (gameId, gameTitle = '') => {
    const cacheKey = `game_${gameId}`;

    // 1. Check Cache
    const cached = await checkCache(cacheKey);
    if (cached) return cached;

    try {
        // Detailed query
        const igdbQuery = `
            fields name, summary, url, rating, rating_count, first_release_date,
            cover.url, 
            genres.name, 
            platforms.name, 
            videos.video_id;
            where id = ${gameId};
        `;

        const results = await fetchIGDB('games', igdbQuery);
        if (!results || results.length === 0) return null;

        const data = results[0];

        // Extract Trailer
        let trailerUrl = '';
        if (data.videos && data.videos.length > 0) {
            trailerUrl = `https://www.youtube.com/watch?v=${data.videos[0].video_id}`;
        }

        const finalData = {
            description: data.summary || '',
            website: data.url,
            rating: data.rating ? Math.round(data.rating) : 0, // 0-100 Score
            rating_count: data.rating_count || 0,
            released: data.first_release_date ? new Date(data.first_release_date * 1000).toISOString().split('T')[0] : null,
            background_image: fixIgdbImage(data.cover?.url),
            trailer: trailerUrl,
            genres: data.genres?.map(g => g.name) || [],
            platforms: data.platforms?.map(p => p.name) || []
        };

        // 2. Save Cache
        await saveToCache(cacheKey, finalData);

        return finalData;
    } catch (error) {
        console.error("IGDB Details Error:", error);
        return null;
    }
};

// Legacy Placeholder
export const searchYoutubeTrailer = async () => '';
