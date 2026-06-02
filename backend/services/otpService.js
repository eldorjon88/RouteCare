const bcrypt = require('bcryptjs');
const { query } = require('../db');

const OTP_TTL_MINUTES = 5;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// Creates a one-time code, stores it hashed, and "sends" it.
async function requestOtp(phone) {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await query(
    'INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1, $2, $3)',
    [phone, codeHash, expiresAt]
  );

  // TODO: integrate a real SMS provider (e.g. Eskiz / Play Mobile for Uzbekistan).
  if ((process.env.OTP_PROVIDER || 'console') === 'console') {
    console.log(`[OTP] ${phone} -> ${code} (valid ${OTP_TTL_MINUTES}m)`);
  }
  return true;
}

// Verifies the most recent unexpired, unconsumed code for a phone number.
async function verifyOtp(phone, code) {
  const { rows } = await query(
    `SELECT id, code_hash FROM otp_codes
      WHERE phone = $1 AND expires_at > NOW() AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1`,
    [phone]
  );
  if (rows.length === 0) return false;

  const match = await bcrypt.compare(code, rows[0].code_hash);
  if (!match) return false;

  await query('UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1', [rows[0].id]);
  return true;
}

module.exports = { requestOtp, verifyOtp };
