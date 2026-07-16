import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Mail, Phone } from "lucide-react";
import { useTheme } from "./ThemeProvider";

function DecorativeOrb({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute animate-pulse-slow rounded-full mix-blend-overlay ${className}`}
      style={{
        background:
          "radial-gradient(circle at center, rgba(0,145,255,0.15), transparent 70%)",
      }}
    />
  );
}

export function Footer() {
  const { t } = useTheme();
  return (
    <footer
      id="contact-section"
      className="relative overflow-hidden border-t border-nejah-electric/10 dark:border-white/5 bg-gradient-to-b from-nejah-sapphire via-[#0a2a4f] to-nejah-midnight dark:from-[#050d1a] dark:via-[#081828] dark:to-black pb-6 pt-16 text-white/90"
    >
      {/* Animated background layers */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,145,255,0.12),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(15,98,172,0.08),transparent_60%)]" />
      <DecorativeOrb className="-left-20 top-1/4 h-64 w-64" />
      <DecorativeOrb className="-right-20 bottom-1/4 h-48 w-48" />

      {/* Decorative elements */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rotate-45 border border-nejah-electric/10 animate-spin-slow" />
      <div className="pointer-events-none absolute -left-10 bottom-20 h-24 w-24 rounded-full border border-nejah-electric/10 animate-float" />

      <div className="container-x relative grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand column */}
        <div className="group/col">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Nejah" className="h-9 w-auto brightness-0 invert" />
          </div>
          <p className="text-sm leading-relaxed text-white/60 transition-colors duration-300 group-hover/col:text-white/70">
            {t.footer.tagline}
          </p>
          <div className="mt-6 flex gap-2">
            {[
              { href: "https://www.facebook.com/profile.php?id=61581323069796", label: "Facebook", Icon: Facebook },
              { href: "https://www.instagram.com/nejah_quran_center?igsh=ZzJrb252ZmxkYng1", label: "Instagram", Icon: Instagram },
              { href: "#", label: "Youtube", Icon: Youtube },
            ].map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group size-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-nejah-electric/40 hover:bg-nejah-electric/20 hover:text-nejah-electric hover:shadow-[0_0_20px_rgba(0,145,255,0.25)]"
              >
                <Icon className="size-4 transition-transform duration-300 group-hover:scale-110" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="group/col">
          <h4 className="font-display text-sm font-bold tracking-wider uppercase mb-4 text-nejah-electric/80">
            {t.footer.quickLinks}
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { href: "/#about", label: t.footer.aboutUs },
              { href: "/#teachers", label: t.footer.ourTeachers },
              { href: "/", label: t.footer.coursesLink, internal: true },
              { label: t.footer.pricing, disabled: true },
            ].map((item) =>
              item.disabled ? (
                <li key={item.label}>
                  <span className="text-white/20 cursor-not-allowed select-none">
                    {item.label}
                  </span>
                </li>
              ) : item.internal ? (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="relative inline-block text-white/50 transition-all duration-200 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-nejah-electric after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="relative inline-block text-white/50 transition-all duration-200 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-nejah-electric after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {item.label}
                  </a>
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Support */}
        <div className="group/col">
          <h4 className="font-display text-sm font-bold tracking-wider uppercase mb-4 text-nejah-electric/80">
            {t.footer.support}
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              { to: "/privacy-policy", label: t.footer.privacy },
              { to: "/terms-of-service", label: t.footer.terms },
            ].map(({ to, label }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="relative inline-block text-white/50 transition-all duration-200 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-nejah-electric after:transition-all after:duration-300 hover:after:w-full"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="group/col">
          <h4 className="font-display text-sm font-bold tracking-wider uppercase mb-4 text-nejah-electric/80">
            {t.footer.contactInfo}
          </h4>
          <ul className="space-y-3 text-sm">
            {[
              { Icon: Mail, text: "Nejahquranc@gmail.com" },
              { Icon: Phone, text: "0960600660" },
              { Icon: Phone, text: "0925697363" },
            ].map(({ Icon, text }) => (
              <li key={text} className="group/contact flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-all duration-300 group-hover/contact:border-nejah-electric/30 group-hover/contact:bg-nejah-electric/10 group-hover/contact:text-nejah-electric group-hover/contact:shadow-[0_0_12px_rgba(0,145,255,0.15)]">
                  <Icon className="size-3.5 transition-transform duration-300 group-hover/contact:scale-110" />
                </span>
                <span className="text-white/60 transition-colors duration-200 group-hover/contact:text-white/90">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative container-x">
        <div className="h-px bg-gradient-to-r from-transparent via-nejah-electric/20 to-transparent" />
        <div className="flex flex-col items-center justify-between gap-2 pt-6 text-xs text-white/40 md:flex-row">
          <span className="transition-colors duration-200 hover:text-white/60">
            {t.footer.rights}
          </span>
          <div className="flex gap-6">
            {[
              { to: "/privacy-policy", label: t.footer.privacyShort },
              { to: "/terms-of-service", label: t.footer.termsShort },
            ].map(({ to, label }) => (
              <Link
                key={label}
                to={to}
                className="relative transition-all duration-200 hover:text-nejah-electric after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-nejah-electric after:transition-all after:duration-300 hover:after:w-full"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
