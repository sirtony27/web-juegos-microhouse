export default async function handler(request, response) {
    // Configuración CORS
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    const { clientId, clientSecret, query, endpoint } = request.body;

    if (!clientId || !clientSecret || !query) {
        return response.status(400).json({ error: 'Missing clientId, clientSecret, or query' });
    }

    try {
        // 1. Obtener Access Token de Twitch
        const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
        const tokenRes = await fetch(tokenUrl, { method: 'POST' });
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return response.status(401).json({ error: 'Failed to authenticate with Twitch' });
        }

        // 2. Consultar IGDB
        const igdbUrl = `https://api.igdb.com/v4/${endpoint || 'games'}`;
        const igdbRes = await fetch(igdbUrl, {
            method: 'POST',
            headers: {
                'Client-ID': clientId,
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'text/plain' // IGDB requires raw body
            },
            body: query
        });

        const data = await igdbRes.json();

        // TRANSLATION LOGIC (Spanish)
        try {
            // Dynamic import for serverless environment compatibility
            const translate = await import('translate-google');

            // Helper to translate a single item
            const translateItem = async (item) => {
                if (item.summary) {
                    try {
                        const translated = await translate.default(item.summary, { to: 'es' });
                        item.summary = translated;
                    } catch (err) {
                        console.error("Translation failed for item:", item.name, err);
                    }
                }
                return item;
            };

            if (Array.isArray(data)) {
                // Translate all items in parallel (limit parallelism if needed, but for few items it's fine)
                await Promise.all(data.map(translateItem));
            } else if (data && data.summary) {
                await translateItem(data);
            }
        } catch (translateErr) {
            console.error("Translation library error:", translateErr);
        }

        return response.status(200).json(data);

    } catch (error) {
        console.error("IGDB Proxy Error:", error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
}
