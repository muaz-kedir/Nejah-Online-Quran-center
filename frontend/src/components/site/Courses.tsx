import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, BookOpen, Users, GraduationCap, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useHomeCms } from "./HomeCmsProvider";
import { pickLocalized, resolveCmsImageUrl, type HomeProgram } from "@/lib/home-cms";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";

const COURSE_IMAGES: Record<string, string> = {
  "Quran Reading": "https://images.unsplash.com/photo-1609592424747-41c1e8e1e5b5?w=800&q=80",
  "Tajweed Course": "https://images.unsplash.com/photo-1589187154270-5bcb50f4b3ef?w=800&q=80",
  "Hifz Program": "https://images.unsplash.com/photo-1594729095022-e1e6e97c0e8f?w=800&q=80",
  "Islamic Studies": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
};

const COURSE_META: Record<string, { duration: string; lessons: string; students: string }> = {
  "Quran Reading": { duration: "6 Months", lessons: "48 Sessions", students: "2,400+" },
  "Tajweed Course": { duration: "8 Months", lessons: "64 Sessions", students: "1,800+" },
  "Hifz Program": { duration: "3+ Years", lessons: "Flexible", students: "950+" },
  "Islamic Studies": { duration: "12 Months", lessons: "96 Sessions", students: "1,200+" },
};

function resolveCourseImage(program: HomeProgram): string {
  const img = resolveCmsImageUrl(program.imageUrl);
  if (img) return img;
  const enTitle = program.title?.en?.trim();
  if (enTitle && COURSE_IMAGES[enTitle]) return COURSE_IMAGES[enTitle];
  return "";
}

export function Courses() {
  const { t, lang } = useTheme();
  const { programsSection, programs, loading } = useHomeCms();
  const [selectedProgram, setSelectedProgram] = useState<HomeProgram | null>(null);

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
    <>
    <section id="courses" className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-nejah-electric">
              {sectionHeader}
            </div>
            <h2 className="heading-premium mb-4 text-3xl md:text-4xl lg:text-5xl">
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

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="data-line-h top-1/2 left-[10%] right-[10%] hidden lg:block" />
          {programs.map((program, i) => {
            const badge = pickLocalized(program.level, lang);
            const title = pickLocalized(program.title, lang);
            const desc = pickLocalized(program.description, lang);
            const img = resolveCourseImage(program);

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
                    <div className="size-full flex items-center justify-center text-muted-foreground text-xs font-mono tracking-wider">
                      No Image
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
                    onClick={() => setSelectedProgram(program)}
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

    <Dialog open={!!selectedProgram} onOpenChange={(open) => { if (!open) setSelectedProgram(null); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-[32px] border-nejah-electric/10 shadow-glow">
        {selectedProgram && <CourseDetailDialog program={selectedProgram} lang={lang} onClose={() => setSelectedProgram(null)} />}
      </DialogContent>
    </Dialog>
    </>
  );
}

function CourseDetailDialog({ program, lang, onClose }: { program: HomeProgram; lang: string; onClose: () => void }) {
  const { t } = useTheme();
  const badge = pickLocalized(program.level, lang);
  const title = pickLocalized(program.title, lang);
  const desc = pickLocalized(program.description, lang);
  const img = resolveCourseImage(program);
  const detailedContent = pickLocalized(program.detailedContent, lang);
  const meta = COURSE_META[program.title?.en?.trim() ?? ""];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero */}
      <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden bg-nejah-midnight">
        {img ? (
          <img
            src={img}
            alt={title}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full flex items-center justify-center">
            <div className="size-16 rounded-full bg-nejah-electric/10 flex items-center justify-center">
              <GraduationCap className="size-8 text-nejah-electric" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-grid-overlay opacity-30" />

        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-nejah-electric/10 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-nejah-electric/5 blur-[60px]" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <span className="inline-block rounded-full border border-nejah-electric/20 bg-background/90 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-nejah-electric backdrop-blur mb-3">
              {badge}
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-foreground">
              {title}
            </h2>
            {desc && (
              <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                {desc}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 space-y-6">
        {meta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: Clock, label: "Duration", value: meta.duration },
              { icon: BookOpen, label: "Lessons", value: meta.lessons },
              { icon: Users, label: "Students", value: meta.students },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-4 text-center hover:border-nejah-electric/20 transition-colors"
              >
                <stat.icon className="size-5 text-nejah-electric mx-auto mb-1" />
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                  {stat.label}
                </div>
                <div className="text-sm font-semibold mt-0.5">{stat.value}</div>
              </div>
            ))}
          </motion.div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-nejah-electric/20 to-transparent" />

        {detailedContent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="relative"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="data-line-dot relative static md:static size-2" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-nejah-electric">
                <Sparkles className="size-3 inline me-1 -mt-0.5" />
                Course Overview
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-nejah-electric/20 to-transparent" />
            </div>
            <div className="gradient-accent-bar rounded-b-none" />
            <div className="rounded-2xl rounded-t-none border border-t-0 border-border/60 bg-card/30 backdrop-blur-sm p-5 md:p-6
              prose prose-lg dark:prose-invert max-w-none
              prose-headings:text-foreground
              prose-h2:text-nejah-electric prose-h2:text-xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:mb-3 prose-h2:mt-6
              prose-h2:first:mt-0
              prose-ul:space-y-1.5 prose-li:text-muted-foreground prose-li:marker:text-nejah-electric/60
              prose-p:text-muted-foreground prose-p:leading-relaxed
            ">
              <div dangerouslySetInnerHTML={{ __html: detailedContent }} />
            </div>
          </motion.div>
        ) : (
          <p className="text-muted-foreground">{desc}</p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="flex gap-3 pt-2"
        >
          <Link to="/register" className="btn-metallic flex-1">
            <span className="flex items-center justify-center gap-2">
              <GraduationCap className="size-5" />
              {t.cta.register}
            </span>
          </Link>
          <DialogClose asChild>
            <button className="btn-metallic-outline flex-1">
              <span className="flex items-center justify-center gap-2">
                <X className="size-5" />
                Close
              </span>
            </button>
          </DialogClose>
        </motion.div>
      </div>
    </motion.div>
  );
}
