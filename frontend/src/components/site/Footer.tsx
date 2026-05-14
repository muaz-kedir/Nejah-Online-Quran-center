import { BookOpen, Facebook, Twitter, Instagram, Youtube, Mail, Phone } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Footer() {
  const { t } = useTheme();
  return (
    <footer id="contact" className="bg-[oklch(0.18_0.03_160)] text-[oklch(0.95_0.01_160)] pt-16 pb-6">
      <div className="container-x grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <BookOpen className="size-5" />
            </div>
            <span className="font-display text-xl font-bold">Nejah</span>
          </div>
          <p className="text-sm text-[oklch(0.95_0.01_160/0.65)] leading-relaxed">
            {t.footer.tagline}
          </p>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">{t.footer.quickLinks}</h4>
          <ul className="space-y-2.5 text-sm text-[oklch(0.95_0.01_160/0.7)]">
            <li><a href="#about" className="hover:text-primary">{t.footer.aboutUs}</a></li>
            <li><a href="#teachers" className="hover:text-primary">{t.footer.ourTeachers}</a></li>
            <li><a href="#courses" className="hover:text-primary">{t.footer.coursesLink}</a></li>
            <li><a href="#" className="hover:text-primary">{t.footer.pricing}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">{t.footer.support}</h4>
          <ul className="space-y-2.5 text-sm text-[oklch(0.95_0.01_160/0.7)]">
            <li><a href="#" className="hover:text-primary">{t.footer.privacy}</a></li>
            <li><a href="#" className="hover:text-primary">{t.footer.terms}</a></li>
            <li><a href="#" className="hover:text-primary">{t.footer.sitemap}</a></li>
            <li><a href="#" className="hover:text-primary">{t.footer.help}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-4">{t.footer.contactInfo}</h4>
          <ul className="space-y-2.5 text-sm text-[oklch(0.95_0.01_160/0.7)]">
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

      <div className="container-x pt-6 border-t border-white/10 text-xs text-[oklch(0.95_0.01_160/0.55)] flex flex-col md:flex-row gap-2 items-center justify-between">
        <span>{t.footer.rights}</span>
        <div className="flex gap-5">
          <a href="#" className="hover:text-primary">{t.footer.privacyShort}</a>
          <a href="#" className="hover:text-primary">{t.footer.termsShort}</a>
        </div>
      </div>
    </footer>
  );
}
