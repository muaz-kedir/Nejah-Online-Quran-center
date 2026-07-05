import { Link } from "@tanstack/react-router";
import { BookOpen, Facebook, Twitter, Instagram, Youtube, Mail, Phone } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Footer() {
  const { t } = useTheme();
  return (
    <footer
      id="contact-section"
      className="relative border-t border-white/5 bg-nejah-sapphire pb-6 pt-16 text-foreground"
    >
      <div className="container-x grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Nejah" className="h-9 w-auto" />
          </div>
          <p className="text-sm leading-relaxed text-nejah-slate-blue">{t.footer.tagline}</p>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">{t.footer.quickLinks}</h4>
          <ul className="space-y-2.5 text-sm text-nejah-slate-blue">
            <li>
              <a href="/#about" className="hover:text-primary">
                {t.footer.aboutUs}
              </a>
            </li>
            <li>
              <a href="/#teachers" className="hover:text-primary">
                {t.footer.ourTeachers}
              </a>
            </li>
            <li>
              <Link to="/" className="hover:text-primary">
                {t.footer.coursesLink}
              </Link>
            </li>
            <li>
              <span className="text-nejah-slate-blue/60 cursor-not-allowed">
                {t.footer.pricing}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">{t.footer.support}</h4>
          <ul className="space-y-2.5 text-sm text-nejah-slate-blue">
            <li>
              <Link to="/privacy-policy" className="hover:text-primary">
                {t.footer.privacy}
              </Link>
            </li>
            <li>
              <Link to="/terms-of-service" className="hover:text-primary">
                {t.footer.terms}
              </Link>
            </li>
            <li>
              <Link to="/sitemap" className="hover:text-primary">
                {t.footer.sitemap}
              </Link>
            </li>
            <li>
              <Link to="/help-center" className="hover:text-primary">
                {t.footer.help}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">{t.footer.contactInfo}</h4>
          <ul className="space-y-2.5 text-sm text-nejah-slate-blue">
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> hello@nejah.com
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> +1 (555) 800-9300
            </li>
          </ul>
          <div className="flex gap-2 mt-4">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="size-9 grid place-items-center rounded-full bg-white/5 hover:bg-primary transition"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container-x flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-nejah-slate-blue md:flex-row">
        <span>{t.footer.rights}</span>
        <div className="flex gap-5">
          <Link to="/privacy-policy" className="hover:text-primary">
            {t.footer.privacyShort}
          </Link>
          <Link to="/terms-of-service" className="hover:text-primary">
            {t.footer.termsShort}
          </Link>
        </div>
      </div>
    </footer>
  );
}
