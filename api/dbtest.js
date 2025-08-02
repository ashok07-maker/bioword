import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('Database query successful:', result.rows[0]);
    
    // Test if tables exist
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('word_breakdowns', 'search_history', 'popular_terms')
    `);
    
    res.status(200).json({
      status: 'Database connected!',
      timestamp: result.rows[0].current_time,
      tablesFound: tableCheck.rows.map(row => row.table_name)
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({
      status: 'Database not connected',
      error: err.message,
      code: err.code
    });
  }
}
