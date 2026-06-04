// Dispatch dashboard: sign in, view active calls, assign nearest ambulance.
const appRoot = document.getElementById('app');

function renderDashboard() {
  appRoot.innerHTML = `
    <div class="stack">
      <div class="card">
        <h2>Live map</h2>
        <div class="map" id="map">Map — add a Maps key in shared/js/config.js to plot ambulances</div>
      </div>
      <div class="card stack">
        <div class="row row--between">
          <h2>Active calls</h2>
          <button id="refresh" class="btn btn--ghost">Refresh</button>
        </div>
        <div id="calls" class="stack"><small>Loading…</small></div>
      </div>
    </div>`;

  document.getElementById('refresh').addEventListener('click', loadCalls);
  loadCalls();
  connect();
}

async function loadCalls() {
  const wrap = document.getElementById('calls');
  try {
    const calls = await window.api.listCalls();
    if (!calls.length) {
      wrap.innerHTML = '<small>No active calls.</small>';
      return;
    }
    wrap.innerHTML = '';
    calls.forEach((c) => wrap.appendChild(callRow(c)));
  } catch (err) {
    wrap.innerHTML = `<small>${err.message}</small>`;
  }
}

function callRow(call) {
  const row = document.createElement('div');
  row.className = 'card row';
  row.innerHTML = `<div class="stack">
      <strong>Call #${call.id}</strong>
      <small>${call.pickup_address || `${call.pickup_lat}, ${call.pickup_lng}`}</small>
    </div>
    <span class="badge">${call.status}</span>`;

  if (call.status === 'requested') {
    const btn = document.createElement('button');
    btn.className = 'btn btn--primary';
    btn.textContent = 'Assign nearest';
    btn.addEventListener('click', () =>
      window.UI.withLoading(btn, async () => {
        await window.api.autoAssign(call.id);
        window.UI.toast('Assigned nearest ambulance', 'success');
        loadCalls();
      })
    );
    row.appendChild(btn);
  }
  return row;
}

function connect() {
  const socket = window.connectSocket();
  if (!socket) return;
  socket.on('call:new', loadCalls);
  socket.on('call:status', loadCalls);
  // TODO: move ambulance markers on the map as location:update events arrive.
  socket.on('location:update', () => {});
}

function boot() {
  if (window.Auth.isAuthed()) renderDashboard();
  else window.mountLogin(appRoot, { role: 'dispatcher', onSuccess: renderDashboard });
}

boot();
