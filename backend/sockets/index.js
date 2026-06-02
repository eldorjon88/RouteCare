// Socket.io handlers for live location and dispatch events.
// Convention: clients join a per-call room ("call:<id>") to receive updates
// for a specific request; drivers emit their position every 2-3s (see CLAUDE.md).
module.exports = function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    // TODO: authenticate the socket using socket.handshake.auth.token (JWT).

    // Driver/ambulance position update.
    // payload: { ambulanceId, lat, lng, callId? }
    socket.on('location:update', (payload) => {
      if (payload && payload.callId) {
        io.to(`call:${payload.callId}`).emit('location:update', payload);
      }
      // Dispatch dashboard listens globally to plot every ambulance.
      io.emit('location:update', payload);
    });

    // Patient or dispatcher subscribes to one call's lifecycle.
    socket.on('call:subscribe', (callId) => {
      socket.join(`call:${callId}`);
    });

    socket.on('disconnect', () => {
      // TODO: if this socket was a driver, mark the ambulance off-duty/offline.
    });
  });
};
