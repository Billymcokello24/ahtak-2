// Adds a visible Light/Dark toggle button to Jazzmin navbar.
// Persists preference in localStorage.
(() => {
  // Jazzmin uses Bootstrap 5 color scheme via:
  // localStorage key: 'jazzmin-theme-mode' with values 'light' | 'dark' | 'auto'
  // and sets: document.documentElement[data-bs-theme]
  const KEY = "jazzmin-theme-mode";

  function getMode() {
    return localStorage.getItem(KEY) || "light";
  }

  function setMode(mode) {
    localStorage.setItem(KEY, mode);
    document.documentElement.setAttribute("data-bs-theme", mode);
  }

  function toggle() {
    const mode = getMode();
    setMode(mode === "dark" ? "light" : "dark");
    updateLabel();
  }

  function ensureApplied() {
    const mode = getMode();
    // Treat 'auto' as computed; UI toggle flips to explicit dark/light.
    if (mode === "auto") {
      const computed =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.setAttribute("data-bs-theme", computed);
    } else {
      document.documentElement.setAttribute("data-bs-theme", mode);
    }
  }

  function makeButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ahtak-theme-toggle btn btn-sm";
    btn.setAttribute("aria-label", "Toggle dark mode");
    btn.title = "Toggle dark mode";
    btn.innerHTML = `
      <span class="ahtak-theme-toggle__icon" aria-hidden="true">🌓</span>
      <span class="ahtak-theme-toggle__text">Theme</span>
    `;
    btn.addEventListener("click", toggle);
    return btn;
  }

  function updateLabel() {
    const mode = getMode();
    const btn = document.querySelector(".ahtak-theme-toggle");
    if (!btn) return;
    const text = btn.querySelector(".ahtak-theme-toggle__text");
    if (!text) return;
    text.textContent = mode === "dark" ? "Dark" : "Light";
    btn.setAttribute("aria-label", mode === "dark" ? "Switch to light mode" : "Switch to dark mode");
    btn.title = mode === "dark" ? "Switch to light mode" : "Switch to dark mode";
  }

  function mount() {
    // Apply stored mode early
    ensureApplied();

    // Try common AdminLTE/Jazzmin navbar containers
    const targets = [
      document.querySelector(".navbar-nav.ml-auto"),
      document.querySelector(".navbar-nav.ms-auto"),
      document.querySelector(".navbar-nav"),
    ].filter(Boolean);

    if (!targets.length) return;
    const nav = targets[0];

    // Avoid duplicates
    if (document.querySelector(".ahtak-theme-toggle")) return;

    const li = document.createElement("li");
    li.className = "nav-item d-flex align-items-center";
    li.appendChild(makeButton());
    nav.prepend(li);
    updateLabel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();

