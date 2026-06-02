// Dark-mode toggle, persisted in localStorage (see CLAUDE.md).
const THEME_KEY = 'routecare_theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function initTheme() {
  const saved =
    localStorage.getItem(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

// Apply immediately to avoid a flash of the wrong theme.
initTheme();

// Wire up any element marked with [data-theme-toggle].
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-theme-toggle]').forEach((b) =>
    b.addEventListener('click', toggleTheme)
  );
});

window.Theme = { initTheme, toggleTheme };
