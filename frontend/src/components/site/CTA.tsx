import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Sparkles, Users, Zap, Orbit, Globe } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTheme } from "./ThemeProvider";

const highlightValues = ["2,000+", "1-on-1", "24 / 7"] as const;
const highlightIcons = [Users, BookOpen, Clock] as const;

function FloatingOrb({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute animate-pulse-slow rounded-full ${className}`}
      style={{
        background:
          "radial-gradient(circle at center, rgba(0,145,255,0.2), transparent 70%)",
      }}
    />
  );
}

function GlowDot({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        background: "rgba(0,145,255,0.3)",
        boxShadow: "0 0 12px 4px rgba(0,145,255,0.2)",
      }}
    />
  );
}

export function CTA() {
  const { t } = useTheme();

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const contactSection = document.getElementById("contact-section");
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-16 md:py-24 relative">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] border border-nejah-electric/20 shadow-[0_0_60px_-10px_rgba(0,145,255,0.2)] bg-gradient-to-br from-nejah-sapphire via-[#0b2860] to-nejah-midnight p-8 md:p-12 lg:p-14"
        >
          {/* Animated background layers */}
          <div className="pointer-events-none absolute inset-0 bg-grid-overlay opacity-[0.12] dark:opacity-[0.15]" />
          <div className="pointer-events-none absolute inset-0 scan-line opacity-[0.04]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_30%,rgba(0,145,255,0.15),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_70%,rgba(15,98,172,0.1),transparent_50%)]" />

          {/* Floating orbs */}
          <FloatingOrb className="-left-16 top-1/3 h-48 w-48" />
          <FloatingOrb className="-right-12 bottom-1/4 h-36 w-36" />

          {/* Glow dots */}
          <GlowDot className="left-1/4 top-8 h-1.5 w-1.5" />
          <GlowDot className="right-1/3 top-12 h-1 w-1" />
          <GlowDot className="left-1/3 bottom-16 h-1 w-1" />
          <GlowDot className="right-1/4 bottom-8 h-1.5 w-1.5" />

          {/* Decorative elements */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 border border-nejah-electric/10"
            style={{ transform: "rotate(45deg)" }}
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -left-8 bottom-12 h-20 w-20 rounded-full border border-nejah-electric/10"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            {/* Left — copy & actions */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-nejah-electric/30 bg-primary/15 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-nejah-electric"
              >
                <Zap className="size-3.5" />
                {t.cta.eyebrow}
              </motion.div>

              <h2 className="mb-4 text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-white via-[#C8E4FF] to-nejah-electric bg-clip-text text-transparent">
                  {t.cta.title}
                </span>
              </h2>

              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mx-auto mb-6 h-px max-w-xs bg-gradient-to-r from-transparent via-nejah-electric/50 to-transparent lg:mx-0"
              />

              <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-white/80 lg:mx-0 md:text-lg">
                {t.cta.desc}
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
              >
                <Link to="/register">
                  <button className="relative overflow-hidden rounded-xl bg-gradient-to-r from-nejah-electric to-[#0066cc] px-6 py-3 font-semibold text-white shadow-[0_0_20px_rgba(0,145,255,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,145,255,0.5)] active:scale-95">
                    <span className="relative z-10 flex items-center gap-2">
                      {t.cta.register} <ArrowRight className="size-4 rtl:rotate-180" />
                    </span>
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]"
                    />
                  </button>
                </Link>
                <button
                  onClick={handleContactClick}
                  className="rounded-xl border border-white/25 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    {t.cta.contact} <Globe className="size-4" />
                  </span>
                </button>
              </motion.div>

              <p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-white/45">
                No commitment · First lesson complimentary
              </p>
            </div>

            {/* Right — highlight cards */}
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[t.cta.stat1, t.cta.stat2, t.cta.stat3].map((label, i) => {
                const Icon = highlightIcons[i];
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.45 }}
                    whileHover={{ scale: 1.03, x: 4 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition-all duration-300 hover:border-nejah-electric/40 hover:bg-white/[0.08] hover:shadow-[0_0_25px_rgba(0,145,255,0.15)] sm:flex-col sm:text-center lg:flex-row lg:text-left"
                  >
                    <motion.div
                      animate={{ opacity: [0, 0.5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
                      className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-nejah-electric/10 blur-xl"
                    />
                    <div className="relative flex items-center gap-4 sm:flex-col lg:flex-row">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-nejah-lg border border-nejah-electric/30 bg-primary/15 text-nejah-electric shadow-[0_0_15px_rgba(0,145,255,0.15)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(0,145,255,0.3)]">
                        <Icon className="size-5 transition-transform duration-300 group-hover:rotate-3" />
                      </div>
                      <div>
                        <p className="font-mono text-xl font-bold tracking-tight text-white">
                          {highlightValues[i]}
                        </p>
                        <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                          {label}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
