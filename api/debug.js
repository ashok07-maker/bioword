export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const debugInfo = {
        environment: process.env.NODE_ENV || 'development',
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
        timestamp: new Date().toISOString(),
        availableEnvVars: Object.keys(process.env).filter(key => 
            key.includes('GEMINI') || key.includes('DATABASE')
        )
    };

    console.log('Debug info:', debugInfo);
    res.status(200).json(debugInfo);
}
