import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Sparkles, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

const highlightValues = ["2,000+", "1-on-1", "24 / 7"] as const;
const highlightIcons = [Users, BookOpen, Clock] as const;

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
    <section className="py-16 md:py-24">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] border border-nejah-border-blue bg-gradient-to-br from-nejah-sapphire via-nejah-azure to-nejah-midnight p-8 shadow-nejah-glow md:p-12 lg:p-14"
        >
          {/* Ambient layers */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,98,172,0.35),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(11,53,91,0.5),transparent_50%)]" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rotate-45 border border-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rotate-12 rounded-full border border-nejah-electric/20" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            {/* Left — copy & actions */}
            <div className="text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-nejah-electric/30 bg-primary/15 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-nejah-electric">
                <Sparkles className="size-3.5" />
                {t.cta.eyebrow}
              </div>

              <h2 className="mb-4 text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-white via-[#C8E4FF] to-nejah-electric bg-clip-text text-transparent">
                  {t.cta.title}
                </span>
              </h2>

              <div className="mx-auto mb-6 h-px max-w-xs bg-gradient-to-r from-transparent via-white/30 to-transparent lg:mx-0" />

              <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-white/75 lg:mx-0 md:text-lg">
                {t.cta.desc}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="h-12 rounded-full px-8 text-base font-semibold shadow-nejah-glow"
                  >
                    {t.cta.register}
                    <ArrowRight className="ms-2 size-4 rtl:rotate-180" />
                  </Button>
                </Link>
                <Button
                  onClick={handleContactClick}
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/25 bg-white/5 px-8 text-base text-white hover:border-white/40 hover:bg-white/10"
                >
                  {t.cta.contact}
                </Button>
              </div>

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
                    transition={{ delay: i * 0.1, duration: 0.45 }}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-nejah-electric/40 hover:bg-white/10 sm:flex-col sm:text-center lg:flex-row lg:text-left"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-nejah-lg border border-nejah-electric/30 bg-primary/15 text-nejah-electric shadow-nejah-glow transition-transform duration-300 group-hover:scale-105">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-mono text-xl font-bold tracking-tight text-white">
                        {highlightValues[i]}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-wider text-white/55">
                        {label}
                      </p>
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
