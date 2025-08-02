import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export default async function handler(req, res) {
    // Add CORS headers first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Log for debugging
        console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
        
        // Test database connection first
        await pool.query('SELECT 1');
        
        const result = await pool.query(`
            SELECT term, search_count, last_searched
            FROM popular_terms
            ORDER BY search_count DESC, last_searched DESC
            LIMIT 10
        `);
        
        console.log('Popular terms query result:', result.rows.length);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        res.status(500).json({ error: error.message });
    }
}
