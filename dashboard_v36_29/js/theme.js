// js/theme.js
(function () {
  const root = document.body;
  const toggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    if (theme === "dark") {
      root.classList.add("theme-dark");
      root.classList.remove("theme-light");
    } else {
      root.classList.add("theme-light");
      root.classList.remove("theme-dark");
    }
    localStorage.setItem("schedmate_theme", theme);
  }

  const stored = localStorage.getItem("schedmate_theme");
  if (stored) {
    applyTheme(stored);
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isDark = root.classList.contains("theme-dark");
      applyTheme(isDark ? "light" : "dark");
    });
  }
})();
