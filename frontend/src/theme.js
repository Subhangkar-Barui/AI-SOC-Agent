const THEME_KEY = "theme";

export function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(nextTheme);
  root.style.colorScheme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);

  const themeColor = nextTheme === "light" ? "#f7fbfa" : "#071010";
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", themeColor);
}
