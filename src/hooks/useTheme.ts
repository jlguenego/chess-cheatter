import { useEffect, useState } from "react";

export type Theme = "dark" | "light" | "warm80s";

const STORAGE_KEY = "chess-cheater-theme";

function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light" || value === "warm80s";
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isTheme(stored)) return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

/**
 * Gère le thème (dark / light / warm80s) : applique l'attribut `data-theme`
 * sur <html> (consommé par les tokens sémantiques de index.css) et persiste le
 * choix. `setTheme` sélectionne directement un thème (contrôle segmenté exclusif).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}
