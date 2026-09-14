// Mirrors the parent site's light/dark toggle: demo/index.html (the
// wrapper that iframes this app) posts { type: 'rhymr-theme', theme }
// whenever the main site's theme button is used, and once on load with
// whatever it already has stored. Falls back to prefers-color-scheme
// (already the tokens.css default) until a message arrives.
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'rhymr-theme') return;

  const root = document.documentElement;
  if (data.theme === 'dark' || data.theme === 'light') {
    root.setAttribute('data-theme', data.theme);
  } else {
    root.removeAttribute('data-theme');
  }
});
