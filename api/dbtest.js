const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).send('Database connected!');
  } catch (err) {
    res.status(500).send('Database not connected: ' + err.message);
  }
};
