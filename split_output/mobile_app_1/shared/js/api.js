// Thin Fetch wrapper: attaches the JWT and surfaces backend errors as Error.message.
async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = window.Auth && window.Auth.getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${window.ROUTECARE_CONFIG.API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

window.api = {
  requestOtp: (phone) => apiFetch('/api/auth/request-otp', { method: 'POST', body: { phone }, auth: false }),
  verifyOtp: (payload) => apiFetch('/api/auth/verify-otp', { method: 'POST', body: payload, auth: false }),
  createCall: (payload) => apiFetch('/api/calls', { method: 'POST', body: payload }),
  listCalls: (status) => apiFetch(`/api/calls${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  autoAssign: (callId) => apiFetch(`/api/calls/${callId}/auto-assign`, { method: 'POST' }),
  setCallStatus: (callId, status) => apiFetch(`/api/calls/${callId}/status`, { method: 'PATCH', body: { status } }),
  listAmbulances: () => apiFetch('/api/drivers'),
  setDriverStatus: (payload) => apiFetch('/api/drivers/me/status', { method: 'PATCH', body: payload }),
};
