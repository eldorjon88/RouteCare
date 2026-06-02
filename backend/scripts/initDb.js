// Applies database/schema.sql to the configured database.
// Usage: npm run db:init
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

(async () => {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Database schema applied from', schemaPath);
  } catch (err) {
    console.error('❌ Failed to apply schema:', err.message);
    if (err.code === '3D000') {
      console.error('   The "routecare" database does not exist yet. Create it first:');
      console.error('   psql -U postgres -f database/create-database.sql');
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
