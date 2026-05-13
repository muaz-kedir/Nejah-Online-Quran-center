import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Globe, Menu, X, BookOpen, ChevronDown } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";

const linkHrefs = [
  { href: "#home", key: "home" as const },
  { href: "#about", key: "about" as const },
  { href: "#courses", key: "courses" as const },
  { href: "#teachers", key: "teachers" as const },
  { href: "#testimonials", key: "testimonials" as const },
  { href: "#contact", key: "contact" as const },
];

const langs = [
  { code: "en" as const, label: "English" },
  { code: "ar" as const, label: "العربية" },
  { code: "am" as const, label: "አማርኛ" },
];

export function Navbar() {
  const { theme, toggleTheme, lang, setLang, t } = useTheme();
  const links = linkHrefs.map((l) => ({ href: l.href, label: t.nav[l.key] }));
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-soft"
          : "bg-transparent"
      }`}
    >
      <nav className="container-x flex items-center justify-between h-16 md:h-20">
        <a href="#home" className="flex items-center gap-2 group">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-soft group-hover:scale-105 transition">
            <BookOpen className="size-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Nejah</span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors group"
            >
              {l.label}
              <span className="absolute inset-x-4 -bottom-0.5 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="size-10 grid place-items-center rounded-full hover:bg-muted transition"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </button>

          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              onBlur={() => setTimeout(() => setLangOpen(false), 150)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-full hover:bg-muted text-sm font-medium transition"
            >
              <Globe className="size-4" />
              {langs.find((l) => l.code === lang)?.label}
              <ChevronDown className="size-3.5 opacity-60" />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 mt-2 w-40 rounded-xl bg-popover border border-border shadow-elevated overflow-hidden"
                >
                  {langs.map((l) => (
                    <button
                      key={l.code}
                      onMouseDown={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition ${
                        l.code === lang ? "text-primary font-semibold" : ""
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button variant="ghost" className="rounded-full">
            {t.nav.login}
          </Button>
          <Button className="rounded-full bg-primary hover:bg-primary/90 shadow-soft">
            {t.nav.register}
          </Button>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden size-10 grid place-items-center rounded-full hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-background z-50 lg:hidden p-6 flex flex-col gap-6 shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xl font-bold">Nejah</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="size-10 grid place-items-center rounded-full hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="size-6" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {links.map((l, i) => (
                  <motion.a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-4 py-3 rounded-xl hover:bg-muted text-base font-medium"
                  >
                    {l.label}
                  </motion.a>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-border"
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {theme === "dark" ? "Light" : "Dark"}
                </button>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as never)}
                  className="flex-1 h-11 rounded-full border border-border bg-background px-3"
                >
                  {langs.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-full">{t.nav.login}</Button>
                <Button className="flex-1 rounded-full">{t.nav.register}</Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
