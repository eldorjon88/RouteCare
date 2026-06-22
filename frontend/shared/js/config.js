// Runtime config. When the apps are served by the backend in development, the API
// and socket share the same origin. For separate deployments (e.g. a Vercel
// frontend + Railway backend) point these at your backend URL.
window.ROUTECARE_CONFIG = {
  API_BASE_URL: window.location.origin, // e.g. 'https://api.routecare.uz'
  SOCKET_URL: window.location.origin,
  MAPS_API_KEY: '', // unused: maps run on Leaflet + OpenStreetMap (no key required)
};
