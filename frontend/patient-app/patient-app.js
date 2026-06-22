// Patient app: sign in, request an ambulance, track its status live.
const appRoot = document.getElementById('app');

// ── MAP INIT (Leaflet + OpenStreetMap, CartoDB dark tiles) ───────────────
let patientMap, patientMarker;
let followGps = true; // stop snapping to GPS once the user drags the pin

function initPatientMap(containerId = 'map') {
  patientMap = MapKit.createDarkMap(containerId, [41.2995, 69.2401], 13); // default: Tashkent

  // Pin shows the pickup. GPS drives it; manual dragging is a fallback ONLY,
  // so it starts disabled and is enabled only if GPS is unavailable.
  patientMarker = L.marker(patientMap.getCenter(), { draggable: true, icon: MapKit.patientIcon() })
    .addTo(patientMap);
  patientMarker.dragging.disable();
  patientMarker.on('dragstart', () => { followGps = false; });
}

// Enable manual pin placement — used only when GPS is unavailable.
let manualNotified = false;
function enableManualPin(message) {
  if (patientMarker && patientMarker.dragging) patientMarker.dragging.enable();
  if (message && !manualNotified) { manualNotified = true; window.UI.toast(message, 'error'); }
}

// "Use My Location": obtain GPS coordinates automatically and set the pin.
function useMyLocation() {
  if (!navigator.geolocation) { enableManualPin('GPS not supported — drag the pin to your location'); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      followGps = true;
      const ll = [pos.coords.latitude, pos.coords.longitude];
      patientMarker.setLatLng(ll);
      patientMap.setView(ll, 16);
      window.UI.toast('Using your current location', 'success');
    },
    () => enableManualPin('GPS unavailable — drag the pin to your location'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ── GEOLOCATION WATCHER ──────────────────────────────────────────────────
function startPatientTracking() {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      if (!followGps) return; // user placed the pin manually
      const { latitude: lat, longitude: lng } = pos.coords;
      patientMarker.setLatLng([lat, lng]);
      patientMap.setView([lat, lng]);
    },
    (err) => {
      console.error(`Geolocation error (${err.code}): ${err.message}`);
      enableManualPin('GPS unavailable — drag the pin to your location');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ── ADDRESS SEARCH (OpenStreetMap Nominatim — free, no API key) ───────────
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Geocode a free-text query to candidate places (biased to Uzbekistan).
async function geocodeAddress(query) {
  const url =
    'https://nominatim.openstreetmap.org/search' +
    '?format=json&addressdetails=1&limit=5&countrycodes=uz&q=' +
    encodeURIComponent(query);
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Address search failed (' + res.status + ')');
  return res.json(); // [{ lat, lon, display_name, ... }]
}

// Move the pickup pin + map to a chosen search result so requestAmbulance()
// captures the right coordinates.
function selectPlace(place, input, results) {
  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lon);
  followGps = false; // user picked an address; don't let GPS snap the pin away
  patientMarker.setLatLng([lat, lng]);
  patientMap.setView([lat, lng], 16);
  input.value = place.display_name;
  results.classList.add('hidden');
  results.innerHTML = '';
  window.UI.toast('Pickup set to searched address', 'success');
}

// Wire the debounced search to the address input + results dropdown.
function setupAddressSearch() {
  const input = document.getElementById('address');
  const results = document.getElementById('addrResults');
  if (!input || !results) return;

  const runSearch = debounce(async (query) => {
    if (query.length < 3) {
      results.classList.add('hidden');
      results.innerHTML = '';
      return;
    }
    let places;
    try {
      places = await geocodeAddress(query);
    } catch (err) {
      window.UI.toast(err.message, 'error');
      return;
    }
    results.innerHTML = '';
    if (!places.length) {
      results.innerHTML = '<li class="search-empty">No matching address</li>';
    } else {
      places.forEach((place) => {
        const li = document.createElement('li');
        li.className = 'search-item';
        li.textContent = place.display_name;
        li.addEventListener('click', () => selectPlace(place, input, results));
        results.appendChild(li);
      });
    }
    results.classList.remove('hidden');
  }, 500);

  input.addEventListener('input', (e) => runSearch(e.target.value.trim()));
}

function renderCallScreen() {
  appRoot.innerHTML = `
    <div class="stack">
      <div class="card stack">
        <h2>Need an ambulance?</h2>
        <div class="field">
          <label for="address">Pickup address (search or drag the pin)</label>
          <input id="address" class="input" placeholder="Search a street, landmark, district…" autocomplete="off" />
          <ul id="addrResults" class="search-results hidden"></ul>
        </div>
        <button id="useGps" type="button" class="btn btn--ghost btn--block">📍 Use My Location</button>
        <div class="map" id="map" role="application" aria-label="Pickup location map"></div>
        <div class="field">
          <label for="notes">What's happening? (optional)</label>
          <input id="notes" class="input" placeholder="e.g. chest pain, fall, difficulty breathing" />
        </div>
        <button id="callBtn" class="btn btn--emergency btn--block">🚑 Call ambulance</button>
      </div>
      <div class="card stack hidden" id="statusCard"></div>
    </div>`;

  const callBtn = appRoot.querySelector('#callBtn');
  callBtn.addEventListener('click', () => window.UI.withLoading(callBtn, requestAmbulance));

  // Map must be created AFTER its container exists in the DOM.
  initPatientMap('map');
  startPatientTracking();
  setupAddressSearch();
  document.getElementById('useGps').addEventListener('click', useMyLocation);
}

async function requestAmbulance() {
  // Pickup = the pin position (GPS-placed or user-dragged).
  const { lat, lng } = patientMarker.getLatLng();
  const call = await window.api.createCall({
    pickupLat: lat,
    pickupLng: lng,
    pickupAddress: document.getElementById('address').value.trim(),
    notes: document.getElementById('notes').value.trim(),
  });
  window.UI.toast('Request sent — finding the nearest ambulance', 'success');
  trackCall(call);
}

function trackCall(call) {
  const card = document.getElementById('statusCard');
  card.classList.remove('hidden');

  let etaMin = null, distKm = null, status = call.status;
  const render = () => {
    card.innerHTML = `<h2>Your ambulance</h2>
      <p>Status: <span class="badge">${status}</span></p>
      ${etaMin != null ? `<p>ETA <strong>${MapKit.fmtEta(etaMin)}</strong> · ${MapKit.fmtDist(distKm)} away</p>` : ''}
      <small>Call #${call.id}</small>`;
  };
  render();

  const patientLL = patientMarker.getLatLng();
  followGps = false; // request placed — stop the pin following GPS
  let ambMarker = null, routeLayer = null, lastRouteFrom = null, fitted = false;

  const socket = window.connectSocket();
  if (!socket) return;
  socket.emit('call:subscribe', call.id);
  socket.on('call:status', (u) => { if (u.id === call.id) { status = u.status; render(); } });
  socket.on('call:assigned', ({ call: c }) => { if (c.id === call.id) { status = c.status; render(); } });

  // Live ambulance: the assigned driver streams location:update tagged with this callId.
  socket.on('location:update', async (d) => {
    if (!d || d.callId !== call.id || d.lat == null) return;
    const ll = [d.lat, d.lng];
    if (ambMarker) MapKit.smoothMove(ambMarker, ll);
    else ambMarker = L.marker(ll, { icon: MapKit.ambulanceIcon() }).addTo(patientMap).bindPopup('Your ambulance');
    if (!fitted) { patientMap.fitBounds([patientLL, ll], { padding: [40, 40] }); fitted = true; }

    // Recalculate the route only when the ambulance moved meaningfully (perf).
    if (!lastRouteFrom || MapKit.distanceM(ll, lastRouteFrom) > 150) {
      lastRouteFrom = ll;
      try {
        const r = await MapKit.getRoute(ll, [patientLL.lat, patientLL.lng]);
        routeLayer = MapKit.drawRoute(patientMap, r.coords, routeLayer);
        etaMin = r.etaMin; distKm = r.distanceKm; render();
      } catch (e) { /* routing is best-effort; keep last known ETA */ }
    }
  });
}

function boot() {
  if (window.Auth.isAuthed()) renderCallScreen();
  else window.mountLogin(appRoot, { role: 'patient', onSuccess: renderCallScreen });
}

boot();
