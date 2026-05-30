import { createContext, useContext, useEffect, useState } from "react";
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

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "light";
};
const getInitialLang = (): Lang => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored && translations[stored]) return stored;
  }
  return "en";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [lang, setLang] = useState<Lang>(getInitialLang);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", dir);
    localStorage.setItem("lang", lang);
  }, [lang, dir]);

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
