import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Globe, Menu, X, BookOpen, ChevronDown } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const linkHrefs = [
  { href: "#home", key: "home" as const },
  { href: "#about", key: "about" as const },
  { href: "#courses", key: "courses" as const },
  { href: "#teachers", key: "teachers" as const },
  { href: "#testimonials", key: "testimonials" as const },
  { href: "#contact-section", key: "contact" as const },
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-panel border-b border-border dark:border-white/5 !rounded-none !shadow-lg"
            : "bg-transparent"
        }`}
      >
        <nav className="container-x flex items-center justify-between h-16 md:h-20">
          <a href="#home" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Nejah" className="h-9 w-auto" />
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative px-4 py-2 text-sm font-medium text-nejah-slate-blue transition-colors hover:text-nejah-electric"
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
              suppressHydrationWarning
            >
              {mounted && (
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
              )}
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

            <Link to="/login">
              <Button variant="ghost" className="rounded-full">
                {t.nav.login}
              </Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-full shadow-[0_0_16px_rgba(0,102,204,0.35)]">
                {t.nav.register}
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden size-10 grid place-items-center rounded-full hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu — portaled full-screen panel so page content never bleeds through on scroll */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[200] lg:hidden flex flex-col bg-background text-foreground overscroll-contain"
                style={{ minHeight: "100dvh" }}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
              >
                <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-nejah-sapphire dark:bg-nejah-surface shrink-0">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Nejah" className="h-9 w-auto" />
                    <span className="font-extrabold text-lg leading-none text-white">Nejah</span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="size-10 grid place-items-center rounded-full text-white hover:bg-white/10"
                    aria-label="Close menu"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain bg-background px-4 py-6">
                  <div className="flex flex-col gap-1">
                    {links.map((l, i) => (
                      <motion.a
                        key={l.href}
                        href={l.href}
                        onClick={() => setMobileOpen(false)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="px-4 py-4 rounded-xl text-xl font-semibold text-foreground hover:bg-primary/10 transition-colors"
                      >
                        {l.label}
                      </motion.a>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 border-t border-border bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTheme}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-border font-medium hover:bg-muted transition"
                      suppressHydrationWarning
                    >
                      {mounted && (
                        <>
                          {theme === "dark" ? (
                            <Sun className="size-4" />
                          ) : (
                            <Moon className="size-4" />
                          )}
                          {theme === "dark" ? "Light" : "Dark"}
                        </>
                      )}
                    </button>
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value as never)}
                      className="flex-1 h-11 rounded-full border border-border bg-background px-3 font-medium"
                    >
                      {langs.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full">
                        {t.nav.login}
                      </Button>
                    </Link>
                    <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full rounded-full">{t.nav.register}</Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
