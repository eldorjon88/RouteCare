// Tiny API client for the shared backend. Stores the JWT in localStorage,
// namespaced by APP_ID so the two apps don't clash on the same machine.
const TOKEN_KEY = window.APP_CONFIG.APP_ID + "_token";

function authHeaders() {
  const t = localStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: "Bearer " + t } : {};
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const { API_BASE_URL, API_PREFIX } = window.APP_CONFIG;
  const res = await fetch(API_BASE_URL + API_PREFIX + path, {
    method,
    headers: { "Content-Type": "application/json", ...(auth ? authHeaders() : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data && data.detail) || "Request failed (" + res.status + ")");
  return data;
}

window.API = {
  isAuthed: () => !!localStorage.getItem(TOKEN_KEY),
  logout: () => localStorage.removeItem(TOKEN_KEY),
  register: (username, password) =>
    request("/auth/register", {
      method: "POST", auth: false,
      body: { username, password, app: window.APP_CONFIG.APP_ID },
    }),
  login: async (username, password) => {
    const d = await request("/auth/login", { method: "POST", auth: false, body: { username, password } });
    localStorage.setItem(TOKEN_KEY, d.access_token);
    return d;
  },
  me: () => request("/users/me"),
  list: () => request("/data"),
  create: (title, content) => request("/data", { method: "POST", body: { title, content } }),
  update: (id, patch) => request("/data/" + id, { method: "PATCH", body: patch }),
  remove: (id) => request("/data/" + id, { method: "DELETE" }),
};
