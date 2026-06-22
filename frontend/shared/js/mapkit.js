// MapKit — shared Leaflet helpers: dark map, icons, OSRM routing, smooth moves.
// Loaded after leaflet.js. Exposes window.MapKit. No app/REST/WS logic here.
(function () {
  const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const TILE_OPTS = {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  };
  const ROUTE_COLOR = '#38bdf8'; // bright cyan — stands out on dark tiles

  function createDarkMap(containerId, center = [41.2995, 69.2401], zoom = 13) {
    const map = L.map(containerId).setView(center, zoom);
    L.tileLayer(TILE_URL, TILE_OPTS).addTo(map);
    return map;
  }

  function ambulanceIcon() {
    return L.divIcon({ className: 'mk-marker mk-glide', html: '🚑', iconSize: [30, 30], iconAnchor: [15, 15] });
  }
  function patientIcon() {
    return L.divIcon({ className: 'mk-marker', html: '📍', iconSize: [30, 30], iconAnchor: [15, 28] });
  }

  // Haversine distance in metres between [lat,lng] points.
  function distanceM(a, b) {
    const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  // OSRM driving route. from/to are [lat,lng].
  // Returns { coords:[[lat,lng]...], distanceKm, etaMin, steps:[{instruction,distanceM}] }.
  async function getRoute(from, to) {
    const url =
      'https://router.project-osrm.org/route/v1/driving/' +
      `${from[1]},${from[0]};${to[1]},${to[0]}` +
      '?overview=full&geometries=geojson&steps=true';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Routing failed (' + res.status + ')');
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || !data.routes.length) throw new Error('No route found');
    const r = data.routes[0];
    const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const steps = ((r.legs[0] && r.legs[0].steps) || []).map((s) => ({
      instruction: maneuverText(s.maneuver, s.name),
      distanceM: s.distance,
    }));
    return { coords, distanceKm: r.distance / 1000, etaMin: r.duration / 60, steps };
  }

  function maneuverText(m, name) {
    const mod = m.modifier ? ' ' + m.modifier : '';
    const on = name ? ' onto ' + name : '';
    switch (m.type) {
      case 'depart': return 'Head out' + (name ? ' on ' + name : '');
      case 'arrive': return 'Arrive at the patient';
      case 'turn': return 'Turn' + mod + on;
      case 'merge': return 'Merge' + mod + on;
      case 'continue': return 'Continue' + mod + (name ? ' on ' + name : '');
      case 'roundabout':
      case 'rotary': return 'Take the roundabout' + (name ? ' to ' + name : '');
      case 'fork': return 'Keep' + mod + on;
      default: return (m.type.charAt(0).toUpperCase() + m.type.slice(1)) + mod + (name ? ' on ' + name : '');
    }
  }

  // Draw/update a route polyline. Reuses `layer` if given (no flicker).
  function drawRoute(map, coords, layer) {
    if (layer) { layer.setLatLngs(coords); return layer; }
    return L.polyline(coords, { color: ROUTE_COLOR, weight: 5, opacity: 0.9, lineJoin: 'round' }).addTo(map);
  }

  // Move a marker; the CSS transition on .mk-glide makes it glide.
  function smoothMove(marker, latlng) {
    marker.setLatLng(latlng);
  }

  const fmtEta = (min) => (min < 1 ? '<1 min' : Math.round(min) + ' min');
  const fmtDist = (km) => (km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km');

  window.MapKit = {
    createDarkMap, ambulanceIcon, patientIcon,
    distanceM, getRoute, drawRoute, smoothMove, fmtEta, fmtDist,
  };
})();
