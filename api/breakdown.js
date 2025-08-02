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

function getClientIP(req) {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         null;
}

export default async function handler(req, res) {
  // Add CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log for debugging
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('Request body:', req.body);
    
    const data = req.body;
    const {
      originalWord, prefix, prefixMeaning, root, rootMeaning,
      suffix, suffixMeaning, combinedMeaning, rawResponse
    } = data;

    if (!originalWord || !prefix || !root || !suffix) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Test database connection first
    await pool.query('SELECT 1');
    
    const result = await pool.query(`
      INSERT INTO word_breakdowns 
      (original_word, prefix, prefix_meaning, root, root_meaning, suffix, suffix_meaning, combined_meaning, raw_response, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id
    `, [originalWord, prefix, prefixMeaning, root, rootMeaning, suffix, suffixMeaning, combinedMeaning, JSON.stringify(rawResponse)]);

    await pool.query(`
      INSERT INTO search_history 
      (search_term, ip_address, user_agent, success, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [originalWord, getClientIP(req), req.headers['user-agent'], true]);

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
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ success: false, error: error.message });
  }
}
