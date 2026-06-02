// Session storage helpers.
// NOTE: localStorage is convenient but exposed to XSS. For production, consider
// httpOnly + Secure cookies and short-lived access tokens (see CLAUDE.md notes).
const TOKEN_KEY = 'routecare_token';
const USER_KEY = 'routecare_user';

window.Auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthed: () => !!localStorage.getItem(TOKEN_KEY),
};
