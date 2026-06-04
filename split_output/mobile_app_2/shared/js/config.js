// Runtime config. When the apps are served by the backend in development, the API
// and socket share the same origin. For separate deployments (e.g. a Vercel
// frontend + Railway backend) point these at your backend URL.
window.ROUTECARE_CONFIG = {
  API_BASE_URL: 'http://localhost:8000', // split deployment: point at the backend API
  SOCKET_URL: 'http://localhost:8000',
  MAPS_API_KEY: '', // TODO: add a Google Maps or Yandex Maps key to enable maps
};
