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
        return response.status(200).json(data);

    } catch (error) {
        console.error("IGDB Proxy Error:", error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
}
