// Native WebSocket wrapper that mimics the small Socket.io-style API
// (.on(event, cb) / .emit(event, data)) the apps already use. Messages are JSON
// objects of the form { event, data }. This replaces the Socket.io client.
function connectSocket() {
  const base =
    (window.ROUTECARE_CONFIG && window.ROUTECARE_CONFIG.SOCKET_URL) || window.location.origin;
  // http -> ws, https -> wss
  const wsUrl = base.replace(/^http/, 'ws') + '/ws';
  const ws = new WebSocket(wsUrl);
  const handlers = {};
  const queue = [];

  ws.addEventListener('open', () => {
    while (queue.length) ws.send(queue.shift());
  });

  ws.addEventListener('message', (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    (handlers[msg.event] || []).forEach((cb) => cb(msg.data));
  });

  return {
    on(event, cb) {
      (handlers[event] = handlers[event] || []).push(cb);
      return this;
    },
    emit(event, data) {
      const message = JSON.stringify({ event, data });
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
      else queue.push(message);
      return this;
    },
    close() {
      ws.close();
    },
  };
}
window.connectSocket = connectSocket;
