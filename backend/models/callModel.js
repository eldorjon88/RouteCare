const { query } = require('../db');

async function createCall({ patientId, pickupLat, pickupLng, pickupAddress, notes }) {
  const { rows } = await query(
    `INSERT INTO calls (patient_id, pickup_lat, pickup_lng, pickup_address, notes, status)
     VALUES ($1, $2, $3, $4, $5, 'requested')
     RETURNING *`,
    [patientId, pickupLat, pickupLng, pickupAddress || null, notes || null]
  );
  return rows[0];
}

async function getById(id) {
  const { rows } = await query('SELECT * FROM calls WHERE id = $1', [id]);
  return rows[0] || null;
}

async function listCalls({ status } = {}) {
  if (status) {
    const { rows } = await query(
      'SELECT * FROM calls WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return rows;
  }
  const { rows } = await query('SELECT * FROM calls ORDER BY created_at DESC');
  return rows;
}

async function assignCall(callId, ambulanceId) {
  const { rows } = await query(
    `UPDATE calls SET ambulance_id = $2, status = 'assigned', assigned_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [callId, ambulanceId]
  );
  return rows[0] || null;
}

async function updateStatus(callId, status) {
  const { rows } = await query(
    'UPDATE calls SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
    [callId, status]
  );
  return rows[0] || null;
}

module.exports = { createCall, getById, listCalls, assignCall, updateStatus };
