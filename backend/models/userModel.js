const { query } = require('../db');

async function findByPhone(phone) {
  const { rows } = await query('SELECT * FROM users WHERE phone = $1', [phone]);
  return rows[0] || null;
}

async function createUser({ phone, role, fullName }) {
  const { rows } = await query(
    `INSERT INTO users (phone, role, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, phone, role, full_name, created_at`,
    [phone, role, fullName || null]
  );
  return rows[0];
}

// Returns the existing user or creates one (used after OTP verification).
async function findOrCreate({ phone, role, fullName }) {
  return (await findByPhone(phone)) || createUser({ phone, role, fullName });
}

module.exports = { findByPhone, createUser, findOrCreate };
