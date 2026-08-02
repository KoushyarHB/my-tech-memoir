"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeToDocument,
  getInitialTheme,
  getSystemTheme,
  persistTheme,
  resolveTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((nextTheme: Theme) => {
    const resolved = resolveTheme(nextTheme);
    applyThemeToDocument(resolved);
    persistTheme(nextTheme);
    setThemeState(nextTheme);
    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    // Reading from localStorage requires client-side effect — this is an
    // external system sync, not a derived state calculation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyTheme(initialTheme);
    setMounted(true);
  }, [applyTheme]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const resolved = getSystemTheme();
      applyThemeToDocument(resolved);
      setResolvedTheme(resolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      applyTheme(nextTheme);
    },
    [applyTheme],
  );

  const toggleTheme = useCallback(() => {
    const nextResolved: ResolvedTheme =
      resolvedTheme === "dark" ? "light" : "dark";
    applyTheme(nextResolved);
  }, [applyTheme, resolvedTheme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      mounted,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, mounted],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
