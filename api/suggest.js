import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // for Vercel/PostgreSQL compatibility
  }
});

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query.q || '';

  if (!query || query.length < 2) {
    return res.status(200).json([]);
  }

  try {
    // Fetch matching biology terms from database
    const result = await pool.query(
      `SELECT original_word FROM word_breakdowns WHERE original_word ILIKE $1 ORDER BY original_word ASC LIMIT 5`,
      [query + '%']
    );

    const suggestions = result.rows.map(row => row.original_word);
    res.status(200).json(suggestions);
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json([]);
  }
}
