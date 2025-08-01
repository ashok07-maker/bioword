const { Pool } = require('pg');

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // for Vercel/PostgreSQL compatibility
  }
});

module.exports = async (req, res) => {
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
};
