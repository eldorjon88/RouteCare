// Patient app: sign in, request an ambulance, track its status live.
const appRoot = document.getElementById('app');

function renderCallScreen() {
  appRoot.innerHTML = `
    <div class="stack">
      <div class="card stack">
        <h2>Need an ambulance?</h2>
        <div class="field">
          <label for="address">Pickup address (or use your current location)</label>
          <input id="address" class="input" placeholder="Street, landmark, district" />
        </div>
        <div class="map" id="map">Map preview — add a Maps key in shared/js/config.js</div>
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
}

async function requestAmbulance() {
  const coords = await getCurrentCoords();
  const call = await window.api.createCall({
    pickupLat: coords.lat,
    pickupLng: coords.lng,
    pickupAddress: document.getElementById('address').value.trim(),
    notes: document.getElementById('notes').value.trim(),
  });
  window.UI.toast('Request sent — finding the nearest ambulance', 'success');
  trackCall(call);
}

// TODO: replace with a draggable map marker; falls back to Tashkent centre.
function getCurrentCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: 41.311, lng: 69.240 });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({ lat: 41.311, lng: 69.240 }),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

function trackCall(call) {
  const card = document.getElementById('statusCard');
  card.classList.remove('hidden');
  const render = (status) => {
    card.innerHTML = `<h2>Your ambulance</h2>
      <p>Status: <span class="badge">${status}</span></p>
      <small>Call #${call.id}</small>`;
  };
  render(call.status);

  const socket = window.connectSocket();
  if (!socket) return;
  socket.emit('call:subscribe', call.id);
  socket.on('call:status', (updated) => { if (updated.id === call.id) render(updated.status); });
  socket.on('call:assigned', ({ call: c }) => { if (c.id === call.id) render(c.status); });
}

function boot() {
  if (window.Auth.isAuthed()) renderCallScreen();
  else window.mountLogin(appRoot, { role: 'patient', onSuccess: renderCallScreen });
}

boot();
