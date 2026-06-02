// PostgreSQL connection pool. All callers should use query() with parameters
// ($1, $2, ...) so values are never string-interpolated into SQL (injection-safe).
const { Pool } = require('pg');

const useUrl = !!process.env.DATABASE_URL;
const ssl = process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined;

const pool = new Pool(
  useUrl
    ? { connectionString: process.env.DATABASE_URL, ssl }
    : { ssl } // falls back to standard PG* environment variables
);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
