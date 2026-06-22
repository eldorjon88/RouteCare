// Dispatch dashboard: sign in, view active calls, assign nearest ambulance.
const appRoot = document.getElementById('app');

// ── MAP INIT (Leaflet + OpenStreetMap, CartoDB dark tiles) ───────────────
let dispatchMap;
const driverPins = new Map();  // ambulanceId -> L.marker (live positions)
const patientPins = new Map(); // callId      -> L.marker (static pickups)

function initDispatchMap(containerId = 'map') {
  dispatchMap = MapKit.createDarkMap(containerId, [41.2995, 69.2401], 12);
}

// ── CALLED FROM THE EXISTING WEBSOCKET HANDLERS ──────────────────────────
// Driver positions arrive as 'location:update' { ambulanceId, lat, lng, ... }.
function updateDriverMarker(data) {
  if (!data || data.lat == null || data.lng == null) return;
  const key = data.ambulanceId ?? 'unknown';
  const existing = driverPins.get(key);
  if (existing) {
    MapKit.smoothMove(existing, [data.lat, data.lng]);
  } else {
    driverPins.set(
      key,
      L.marker([data.lat, data.lng], { title: `Ambulance ${key}`, icon: MapKit.ambulanceIcon() })
        .addTo(dispatchMap)
        .bindPopup(key === 'unknown' ? 'Ambulance' : `Ambulance #${key}`)
    );
  }
}

// Patient pickup pins come from the calls list (call.pickup_lat / pickup_lng).
const ACTIVE_CALL_STATUSES = new Set(['requested', 'assigned', 'en_route', 'arrived', 'transporting']);

function syncPatientPins(calls) {
  const seen = new Set();
  calls.forEach((c) => {
    if (!ACTIVE_CALL_STATUSES.has(c.status)) return;
    seen.add(c.id);
    const existing = patientPins.get(c.id);
    if (existing) {
      existing.setLatLng([c.pickup_lat, c.pickup_lng]);
    } else {
      patientPins.set(
        c.id,
        L.marker([c.pickup_lat, c.pickup_lng], { title: `Call #${c.id}`, icon: MapKit.patientIcon() })
          .addTo(dispatchMap)
          .bindPopup(`Call #${c.id} — patient pickup`)
      );
    }
  });
  // Drop pins for calls that finished or were cancelled.
  patientPins.forEach((pin, id) => {
    if (!seen.has(id)) {
      pin.remove();
      patientPins.delete(id);
    }
  });
}

function renderDashboard() {
  appRoot.innerHTML = `
    <div class="stack">
      <div class="card">
        <h2>Live map</h2>
        <div class="map" id="map" role="application" aria-label="Live ambulance and call map"></div>
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
  initDispatchMap('map'); // map must exist before loadCalls() syncs pins onto it
  loadCalls();
  connect();
}

async function loadCalls() {
  const wrap = document.getElementById('calls');
  try {
    const calls = await window.api.listCalls();
    syncPatientPins(calls);
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
  socket.on('location:update', updateDriverMarker);
}

function boot() {
  if (window.Auth.isAuthed()) renderDashboard();
  else window.mountLogin(appRoot, { role: 'dispatcher', onSuccess: renderDashboard });
}

boot();
