import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useHomeCms } from "./HomeCmsProvider";
import { pickLocalized, resolveCmsImageUrl } from "@/lib/home-cms";

export function Courses() {
  const { t, lang } = useTheme();
  const { programsSection, programs, loading } = useHomeCms();

  if (loading || !programsSection) {
    return (
      <section id="courses" className="py-20 md:py-28">
        <div className="container-x">
          <div className="h-64 rounded-3xl bg-muted/30 animate-pulse" />
        </div>
      </section>
    );
  }

  const sectionHeader = pickLocalized(programsSection.sectionHeader, lang);
  const mainTitle = pickLocalized(programsSection.mainTitle, lang);
  const description = pickLocalized(programsSection.description, lang);

  return (
    <section id="courses" className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-nejah-electric">
              {sectionHeader}
            </div>
            <h2 className="mb-4 text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {mainTitle}
            </h2>
            <p className="text-base text-nejah-slate-blue md:text-lg">{description}</p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
          >
            {t.courses.viewAll} <ArrowRight className="size-4 rtl:rotate-180" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program, i) => {
            const badge = pickLocalized(program.level, lang);
            const title = pickLocalized(program.title, lang);
            const desc = pickLocalized(program.description, lang);
            const img = resolveCmsImageUrl(program.imageUrl);

            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="glass-panel group overflow-hidden rounded-3xl transition-all hover:border-nejah-electric/30"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                  {img ? (
                    <img
                      src={img}
                      alt={title}
                      loading="lazy"
                      className="size-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground text-xs">
                      No image
                    </div>
                  )}
                  <span className="absolute top-3 start-3 rounded-full border border-nejah-electric/20 bg-background/90 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-nejah-electric backdrop-blur">
                    {badge}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-medium text-foreground">{title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-nejah-slate-blue">{desc}</p>
                  <Button
                    variant="outline"
                    className="h-10 w-full rounded-full border-nejah-electric/30 text-sm font-semibold text-nejah-electric hover:border-nejah-electric hover:bg-primary hover:text-white hover:shadow-[0_0_16px_rgba(0,102,204,0.35)]"
                  >
                    {t.courses.learnMore}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
