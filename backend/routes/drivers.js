const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../db');

const router = express.Router();

// Driver updates their ambulance availability and (optionally) position.
router.patch('/me/status', authenticate, authorize('driver'), async (req, res, next) => {
  try {
    const allowed = ['available', 'on_call', 'off_duty'];
    const { status, lat, lng } = req.body;
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const { rows } = await query(
      `UPDATE ambulances
          SET status = $2,
              lat = COALESCE($3, lat),
              lng = COALESCE($4, lng),
              updated_at = NOW()
        WHERE driver_id = $1
        RETURNING *`,
      [req.user.id, status, lat ?? null, lng ?? null]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No ambulance is linked to this driver' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Dispatcher views all ambulances (for the live map).
router.get('/', authenticate, authorize('dispatcher'), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM ambulances ORDER BY status, id');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
