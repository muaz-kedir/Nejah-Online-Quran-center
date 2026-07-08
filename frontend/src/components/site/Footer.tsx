import { Link } from "@tanstack/react-router";
import { BookOpen, Facebook, Instagram, Youtube, Mail, Phone } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Footer() {
  const { t } = useTheme();
  return (
    <footer
      id="contact-section"
      className="relative overflow-hidden border-t border-nejah-electric/10 dark:border-white/5 bg-nejah-sapphire dark:bg-nejah-midnight pb-6 pt-16 text-white/90"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,145,255,0.08),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(15,98,172,0.06),transparent_60%)]" />

      <div className="data-line-h absolute top-0 left-[10%] right-[10%] opacity-30" />

      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rotate-45 border border-nejah-electric/10" />
      <div className="pointer-events-none absolute -left-10 bottom-20 h-24 w-24 rounded-full border border-nejah-electric/10" />

      <div className="container-x relative grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Nejah" className="h-9 w-auto brightness-0 invert" />
          </div>
          <p className="text-sm leading-relaxed text-white/60">{t.footer.tagline}</p>
          <div className="mt-6 flex gap-2">
            <a
              href="https://www.facebook.com/profile.php?id=61581323069796"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="group size-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-nejah-electric/40 hover:bg-nejah-electric/20 hover:text-nejah-electric hover:shadow-[0_0_20px_rgba(0,145,255,0.25)]"
            >
              <Facebook className="size-4 transition-transform duration-300 group-hover:scale-110" />
            </a>
            <a
              href="https://www.instagram.com/nejah_quran_center?igsh=ZzJrb252ZmxkYng1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="group size-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-nejah-electric/40 hover:bg-nejah-electric/20 hover:text-nejah-electric hover:shadow-[0_0_20px_rgba(0,145,255,0.25)]"
            >
              <Instagram className="size-4 transition-transform duration-300 group-hover:scale-110" />
            </a>
            <a
              href="#"
              aria-label="Youtube"
              className="group size-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-nejah-electric/40 hover:bg-nejah-electric/20 hover:text-nejah-electric hover:shadow-[0_0_20px_rgba(0,145,255,0.25)]"
            >
              <Youtube className="size-4 transition-transform duration-300 group-hover:scale-110" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4 text-white/90">{t.footer.quickLinks}</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="/#about" className="text-white/50 transition-colors duration-200 hover:text-nejah-electric">
                {t.footer.aboutUs}
              </a>
            </li>
            <li>
              <a href="/#teachers" className="text-white/50 transition-colors duration-200 hover:text-nejah-electric">
                {t.footer.ourTeachers}
              </a>
            </li>
            <li>
              <Link to="/" className="text-white/50 transition-colors duration-200 hover:text-nejah-electric">
                {t.footer.coursesLink}
              </Link>
            </li>
            <li>
              <span className="text-white/30 cursor-not-allowed">{t.footer.pricing}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4 text-white/90">{t.footer.support}</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/privacy-policy" className="text-white/50 transition-colors duration-200 hover:text-nejah-electric">
                {t.footer.privacy}
              </Link>
            </li>
            <li>
              <Link to="/terms-of-service" className="text-white/50 transition-colors duration-200 hover:text-nejah-electric">
                {t.footer.terms}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4 text-white/90">{t.footer.contactInfo}</h4>
          <ul className="space-y-3 text-sm">
            <li className="group flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors duration-200 group-hover:border-nejah-electric/30 group-hover:bg-nejah-electric/10 group-hover:text-nejah-electric">
                <Mail className="size-3.5" />
              </span>
              <span className="text-white/60 group-hover:text-white/80 transition-colors duration-200">Nejahquranc@gmail.com</span>
            </li>
            <li className="group flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors duration-200 group-hover:border-nejah-electric/30 group-hover:bg-nejah-electric/10 group-hover:text-nejah-electric">
                <Phone className="size-3.5" />
              </span>
              <span className="text-white/60 group-hover:text-white/80 transition-colors duration-200">0960600660</span>
            </li>
            <li className="group flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors duration-200 group-hover:border-nejah-electric/30 group-hover:bg-nejah-electric/10 group-hover:text-nejah-electric">
                <Phone className="size-3.5" />
              </span>
              <span className="text-white/60 group-hover:text-white/80 transition-colors duration-200">0925697363</span>
            </li>
          </ul>
          <div className="flex gap-2 mt-4">
            <a
              href="https://www.facebook.com/profile.php?id=61581323069796"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="size-9 grid place-items-center rounded-full bg-white/5 hover:bg-primary transition"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href="https://www.instagram.com/nejah_quran_center?igsh=ZzJrb252ZmxkYng1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="size-9 grid place-items-center rounded-full bg-white/5 hover:bg-primary transition"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="#"
              aria-label="Youtube"
              className="size-9 grid place-items-center rounded-full bg-white/5 hover:bg-primary transition"
            >
              <Youtube className="size-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative container-x">
        <div className="h-px bg-gradient-to-r from-transparent via-nejah-electric/20 to-transparent" />
        <div className="flex flex-col items-center justify-between gap-2 pt-6 text-xs text-white/40 md:flex-row">
          <span>{t.footer.rights}</span>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="transition-colors duration-200 hover:text-nejah-electric">
              {t.footer.privacyShort}
            </Link>
            <Link to="/terms-of-service" className="transition-colors duration-200 hover:text-nejah-electric">
              {t.footer.termsShort}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
