const { Pool } = require('pg');

// Database configuration for Supabase
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  // Connection pool settings optimized for Supabase
  max: 20, // max number of connections
  idleTimeoutMillis: 30000, // close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // return error after 10 seconds if connection could not be established
  maxUses: 7500, // close (and replace) a connection after it has been used 7500 times
});

// Test database connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Supabase PostgreSQL database');

    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('Database test query successful:', result.rows[0]);

    client.release();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Please check your Supabase configuration in .env file');
    throw error;
  }
};

// Query helper function with better error handling for Supabase
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Transaction helper function
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get a client for multiple queries
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  pool,
  connectDB,
  query,
  transaction,
  getClient
};
