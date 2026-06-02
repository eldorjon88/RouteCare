const express = require('express');
const jwt = require('jsonwebtoken');
const { requestOtp, verifyOtp } = require('../services/otpService');
const { findOrCreate } = require('../models/userModel');

const router = express.Router();

const PHONE_RE = /^\+998\d{9}$/; // E.164 for Uzbekistan (see CLAUDE.md)
const ROLES = ['patient', 'driver', 'dispatcher'];

// POST /api/auth/request-otp  { phone }
router.post('/request-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!PHONE_RE.test(phone || '')) {
      return res.status(400).json({ error: 'A valid +998XXXXXXXXX phone is required' });
    }
    await requestOtp(phone);
    res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp  { phone, code, role?, fullName? }
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, code, role, fullName } = req.body;
    if (!PHONE_RE.test(phone || '') || !code) {
      return res.status(400).json({ error: 'phone and code are required' });
    }

    const ok = await verifyOtp(phone, code);
    if (!ok) return res.status(401).json({ error: 'Invalid or expired code' });

    const user = await findOrCreate({
      phone,
      role: ROLES.includes(role) ? role : 'patient',
      fullName,
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
