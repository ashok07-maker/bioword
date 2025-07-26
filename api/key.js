module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Return the API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key endpoint called - Key exists:', !!apiKey);
    
    if (!apiKey) {
        console.error('GEMINI_API_KEY environment variable not found');
        return res.status(500).json({ error: 'API key not configured' });
    }

    res.status(200).send(apiKey);
};
