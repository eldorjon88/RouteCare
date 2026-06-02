require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const callRoutes = require('./routes/calls');
const driverRoutes = require('./routes/drivers');
const registerSocketHandlers = require('./sockets');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

// Make io reachable from route handlers via req.app.get('io').
app.set('io', io);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Rate limiting (see CLAUDE.md security standards). A generous global limit,
// plus a strict limit on auth to deter OTP/SMS abuse.
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again shortly.' },
});
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Health check (no DB dependency, so it works before the database is set up).
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'routecare', time: new Date().toISOString() })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/drivers', driverRoutes);

// Serve the vanilla-JS frontend apps in development for convenience.
// (In production the frontend is deployed separately, e.g. to Vercel.)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Centralized error handler — log details, return a safe message.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.publicMessage || 'Internal server error' });
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`RouteCare backend listening on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
