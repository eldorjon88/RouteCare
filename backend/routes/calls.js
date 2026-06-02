const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { createCall, getById, listCalls, assignCall, updateStatus } = require('../models/callModel');
const { findNearestAmbulance, setAmbulanceStatus } = require('../services/dispatchService');

const router = express.Router();

// Patient creates an ambulance request.
router.post('/', authenticate, authorize('patient'), async (req, res, next) => {
  try {
    const { pickupLat, pickupLng, pickupAddress, notes } = req.body;
    if (pickupLat == null || pickupLng == null) {
      return res.status(400).json({ error: 'pickupLat and pickupLng are required' });
    }
    const call = await createCall({ patientId: req.user.id, pickupLat, pickupLng, pickupAddress, notes });

    req.app.get('io').emit('call:new', call); // notify dispatch dashboards
    res.status(201).json(call);
  } catch (err) {
    next(err);
  }
});

// Dispatcher lists calls (optionally filtered by ?status=).
router.get('/', authenticate, authorize('dispatcher'), async (req, res, next) => {
  try {
    res.json(await listCalls({ status: req.query.status }));
  } catch (err) {
    next(err);
  }
});

// Dispatcher assigns the nearest available ambulance to a requested call.
router.post('/:id/auto-assign', authenticate, authorize('dispatcher'), async (req, res, next) => {
  try {
    const call = await getById(req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });

    const ambulance = await findNearestAmbulance(call.pickup_lat, call.pickup_lng);
    if (!ambulance) return res.status(409).json({ error: 'No available ambulance' });

    const updated = await assignCall(call.id, ambulance.id);
    await setAmbulanceStatus(ambulance.id, 'on_call');

    const io = req.app.get('io');
    io.to(`call:${call.id}`).emit('call:status', updated);
    io.emit('call:assigned', { call: updated, ambulance });
    res.json({ call: updated, ambulance });
  } catch (err) {
    next(err);
  }
});

// Driver or dispatcher advances a call's status.
router.patch('/:id/status', authenticate, authorize('driver', 'dispatcher'), async (req, res, next) => {
  try {
    const allowed = ['assigned', 'en_route', 'arrived', 'transporting', 'completed', 'cancelled'];
    const { status } = req.body;
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const updated = await updateStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Call not found' });

    req.app.get('io').to(`call:${req.params.id}`).emit('call:status', updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
