import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import { translations, type Lang, type Dict } from "./i18n";

type Theme = "light" | "dark";

interface Ctx {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  dir: "ltr" | "rtl";
}

const ThemeCtx = createContext<Ctx | null>(null);

function getUserId(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("userId") || "guest";
  }
  return "guest";
}

function themeKey(userId: string): string {
  return `theme_${userId}`;
}

function readThemeForUser(userId?: string): Theme {
  const id = userId ?? getUserId();
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(themeKey(id)) as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
  }
  return "light";
}

const getInitialLang = (): Lang => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored && translations[stored]) return stored;
  }
  return "en";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readThemeForUser());
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const lastUserIdRef = { current: getUserId() };

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(themeKey(getUserId()), theme);
  }, [theme]);

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", dir);
    localStorage.setItem("lang", lang);
  }, [lang, dir]);

  const handleAuthChange = useCallback(() => {
    const newUserId = getUserId();
    const prevUserId = lastUserIdRef.current;
    lastUserIdRef.current = newUserId;

    if (newUserId === prevUserId) return;

    if (newUserId === "guest" && prevUserId !== "guest") {
      return;
    }

    setTheme(readThemeForUser(newUserId));
  }, []);

  useEffect(() => {
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, [handleAuthChange]);

  return (
    <ThemeCtx.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        lang,
        setLang,
        t: translations[lang],
        dir,
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme outside provider");
  return ctx;
}
