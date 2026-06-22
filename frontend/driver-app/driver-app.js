// Driver app: sign in, set availability, receive and act on dispatched calls.
const appRoot = document.getElementById('app');

let socket; // module-scoped so the GPS watcher can emit on the existing connection
let currentAmbulance = null; // captured from setDriverStatus() responses
let activeCallId = null;     // set when the driver goes en route on a call

// ── MAP + NAVIGATION STATE ───────────────────────────────────────────────
let driverMap, driverMarker, patientMarkerD;
let destination = null;   // [lat,lng] of the patient while navigating
let routeLayer = null;    // OSRM polyline layer
let lastRouteFrom = null; // driver pos at last route calc (recalc threshold)

function initDriverMap(containerId = 'map') {
  driverMap = MapKit.createDarkMap(containerId, [41.2995, 69.2401], 13);
}

// ── HIGH-ACCURACY DRIVER TRACKING ────────────────────────────────────────
let lastSentAt = 0;
const SEND_INTERVAL_MS = 2500; // CLAUDE.md: emit location every 2–3 seconds

function startDriverTracking() {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const ll = [lat, lng];

      if (driverMarker) MapKit.smoothMove(driverMarker, ll);
      else driverMarker = L.marker(ll, { icon: MapKit.ambulanceIcon() }).addTo(driverMap);
      if (!destination) driverMap.setView(ll); // before nav, keep centring on self

      // Emit over the EXISTING socket wrapper, throttled to the 2–3s cadence.
      const now = Date.now();
      if (socket && now - lastSentAt >= SEND_INTERVAL_MS) {
        lastSentAt = now;
        socket.emit('location:update', {
          ambulanceId: currentAmbulance ? currentAmbulance.id : null,
          callId: activeCallId,
          lat,
          lng,
          accuracy,
        });
      }

      // While navigating, recalc the route once we've moved meaningfully (perf).
      if (destination && (!lastRouteFrom || MapKit.distanceM(ll, lastRouteFrom) > 150)) {
        lastRouteFrom = ll;
        recalcRoute(ll);
      }
    },
    (err) => console.error(`Driver GPS error (${err.code}): ${err.message}`),
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
}

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
        <h2>Live location</h2>
        <div class="map" id="map" role="application" aria-label="Your live location map"></div>
        <div id="navPanel" class="nav-panel hidden"></div>
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

  // Map must be created AFTER its container exists in the DOM.
  initDriverMap('map');
  startDriverTracking();
}

async function setStatus(status) {
  const coords = await getCoords();
  currentAmbulance = await window.api.setDriverStatus({ status, ...coords });
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
      window.UI.toast('Marked en route — navigating to patient', 'success');
      startNavigation(call); // auto-route to the patient (sets activeCallId)
    })
  );
  row.appendChild(btn);
  list.prepend(row);
}

// ── NAVIGATION (auto OSRM route from the ambulance to the patient) ────────
function startNavigation(call) {
  activeCallId = call.id;                               // GPS updates now tag this call
  destination = [call.pickup_lat, call.pickup_lng];     // patient coords (received automatically)
  lastRouteFrom = null;

  if (patientMarkerD) patientMarkerD.setLatLng(destination);
  else patientMarkerD = L.marker(destination, { icon: MapKit.patientIcon() }).addTo(driverMap).bindPopup('Patient');

  driverMap.setView(destination, 15); // auto-center on the patient
  document.getElementById('navPanel').classList.remove('hidden');

  if (driverMarker) {
    const from = driverMarker.getLatLng();
    recalcRoute([from.lat, from.lng]);
  } else {
    document.getElementById('navPanel').innerHTML = '<div class="nav-head"><span>Waiting for GPS fix…</span></div>';
  }
}

async function recalcRoute(fromLL) {
  if (!destination) return;
  try {
    const r = await MapKit.getRoute(fromLL, destination);
    routeLayer = MapKit.drawRoute(driverMap, r.coords, routeLayer);
    renderNav(r);
  } catch (e) {
    console.error('Route error:', e.message);
  }
}

function renderNav(r) {
  const panel = document.getElementById('navPanel');
  if (!panel) return;
  const steps = r.steps.slice(0, 4).map((s, i) =>
    `<li class="${i === 0 ? 'nav-next' : ''}">${s.instruction}<span>${MapKit.fmtDist(s.distanceM / 1000)}</span></li>`
  ).join('');
  panel.innerHTML =
    '<div class="nav-head"><span>🚑 → 📍 Patient</span>' +
    `<span class="nav-eta">${MapKit.fmtEta(r.etaMin)} · ${MapKit.fmtDist(r.distanceKm)}</span></div>` +
    `<ol class="nav-steps">${steps}</ol>`;
}

function connect() {
  socket = window.connectSocket();
  if (!socket) return;
  socket.on('call:new', addCall);
  socket.on('call:assigned', ({ call }) => addCall(call));
}

function boot() {
  if (window.Auth.isAuthed()) renderDashboard();
  else window.mountLogin(appRoot, { role: 'driver', onSuccess: renderDashboard });
}

boot();
