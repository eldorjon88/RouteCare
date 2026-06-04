// Driver app: sign in, set availability, receive and act on dispatched calls.
const appRoot = document.getElementById('app');

function renderDashboard() {
  appRoot.innerHTML = `
    <div class="stack">
      <div class="card stack">
        <h2>Your status</h2>
        <div class="row">
          <button class="btn btn--success" data-status="available">Available</button>
          <button class="btn btn--ghost" data-status="on_call">On call</button>
          <button class="btn btn--ghost" data-status="off_duty">Off duty</button>
        </div>
        <small id="statusHint">Set yourself Available to start receiving calls.</small>
      </div>
      <div class="card stack">
        <h2>Incoming calls</h2>
        <div id="calls" class="stack"><small>No calls yet.</small></div>
      </div>
    </div>`;

  appRoot.querySelectorAll('[data-status]').forEach((b) =>
    b.addEventListener('click', () => window.UI.withLoading(b, () => setStatus(b.dataset.status)))
  );
  connect();
}

async function setStatus(status) {
  const coords = await getCoords();
  await window.api.setDriverStatus({ status, ...coords });
  window.UI.toast(`Status set to "${status}"`, 'success');
}

function getCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({}),
      { timeout: 5000 }
    );
  });
}

function addCall(call) {
  const list = document.getElementById('calls');
  const placeholder = list.querySelector('small');
  if (placeholder) list.innerHTML = '';

  const row = document.createElement('div');
  row.className = 'card row';
  row.innerHTML = `<div class="stack">
      <strong>Call #${call.id}</strong>
      <small>${call.pickup_address || 'Location shared on map'}</small>
    </div>`;

  const btn = document.createElement('button');
  btn.className = 'btn btn--primary';
  btn.textContent = 'En route';
  btn.addEventListener('click', () =>
    window.UI.withLoading(btn, async () => {
      await window.api.setCallStatus(call.id, 'en_route');
      window.UI.toast('Marked en route', 'success');
      // TODO: start emitting location:update every 2-3s and open navigation.
    })
  );
  row.appendChild(btn);
  list.prepend(row);
}

function connect() {
  const socket = window.connectSocket();
  if (!socket) return;
  socket.on('call:new', addCall);
  socket.on('call:assigned', ({ call }) => addCall(call));
}

function boot() {
  if (window.Auth.isAuthed()) renderDashboard();
  else window.mountLogin(appRoot, { role: 'driver', onSuccess: renderDashboard });
}

boot();
