export type ThemeName = "paper" | "night";

const STORAGE_KEY = "the-ink-home:theme";

export function getStoredTheme(): ThemeName | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "paper" || value === "night" ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): ThemeName {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "paper";
}

export function getTheme(): ThemeName {
  return getStoredTheme() ?? getSystemTheme();
}

export function setTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — the in-memory attribute still applies */
  }
}
