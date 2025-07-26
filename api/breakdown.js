const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Helper function to get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : null);
}

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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const data = req.body;
        const { 
            originalWord, 
            prefix, 
            prefixMeaning, 
            root, 
            rootMeaning, 
            suffix, 
            suffixMeaning, 
            combinedMeaning,
            rawResponse 
        } = data;

        // Save to word_breakdowns table
        const result = await pool.query(`
            INSERT INTO word_breakdowns 
            (original_word, prefix, prefix_meaning, root, root_meaning, suffix, suffix_meaning, combined_meaning, raw_response, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING id
        `, [originalWord, prefix, prefixMeaning, root, rootMeaning, suffix, suffixMeaning, combinedMeaning, JSON.stringify(rawResponse)]);

        // Log search history
        await pool.query(`
            INSERT INTO search_history 
            (search_term, ip_address, user_agent, success, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [originalWord, getClientIP(req), req.headers['user-agent'], true]);

        // Update popular terms
        await pool.query(`
            INSERT INTO popular_terms (term, search_count, last_searched)
            VALUES ($1, 1, NOW())
            ON CONFLICT (term) 
            DO UPDATE SET 
                search_count = popular_terms.search_count + 1,
                last_searched = NOW()
        `, [originalWord.toLowerCase()]);

        res.status(200).json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
