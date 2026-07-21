import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, Clock, BookOpen, Users, GraduationCap, X, Sparkles,
  Zap, Target, Award, ChevronRight, Star, Layers, BarChart3,
} from "lucide-react";
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
  "quran reading": "https://images.unsplash.com/photo-1589187154270-5bcb50f4b3ef?w=800&q=80",
  "tajweed": "https://images.unsplash.com/photo-1621905252507-b35492cc74b2?w=800&q=80",
  "hifz": "https://images.unsplash.com/photo-1594729095022-e1e6e97c0e8f?w=800&q=80",
  "islamic studies": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
};

const COURSE_META: Record<string, { duration: string; lessons: string; students: string }> = {
  "Quran Reading": { duration: "6 Months", lessons: "48 Sessions", students: "2,400+" },
  "Tajweed Course": { duration: "8 Months", lessons: "64 Sessions", students: "1,800+" },
  "Hifz Program": { duration: "3+ Years", lessons: "Flexible", students: "950+" },
  "Islamic Studies": { duration: "12 Months", lessons: "96 Sessions", students: "1,200+" },
};

const COURSE_BENEFITS: Record<string, string[]> = {
  "Quran Reading": ["Master Arabic script", "Fluid recitation", "Confident reading"],
  "Tajweed Course": ["Perfect pronunciation", "Rhythm & melody", "Apply rules"],
  "Hifz Program": ["Memorization techniques", "Revision system", "Ijazah track"],
  "Islamic Studies": ["Foundational knowledge", "Contemporary relevance", "Scholarly insights"],
};

function resolveCourseImage(program: HomeProgram): string {
  const img = resolveCmsImageUrl(program.imageUrl);
  if (img) return img;
  const enTitle = (program.title?.en ?? "").toLowerCase().trim();
  for (const [key, url] of Object.entries(COURSE_IMAGES)) {
    if (enTitle.includes(key)) return url;
  }
  return "";
}

function lookupMeta(program: HomeProgram) {
  const enTitle = (program.title?.en ?? "").toLowerCase().trim();
  for (const [key, meta] of Object.entries(COURSE_META)) {
    if (enTitle.includes(key.toLowerCase())) return meta;
  }
  return undefined;
}

function lookupBenefits(program: HomeProgram) {
  const enTitle = (program.title?.en ?? "").toLowerCase().trim();
  for (const [key, benefits] of Object.entries(COURSE_BENEFITS)) {
    if (enTitle.includes(key.toLowerCase())) return benefits;
  }
  return undefined;
}

function GlowDot({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        background: "rgba(0,145,255,0.25)",
        boxShadow: "0 0 10px 3px rgba(0,145,255,0.15)",
      }}
    />
  );
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
    <section id="courses" className="py-20 md:py-28 relative">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-nejah-electric/20 bg-primary/10 px-3.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-nejah-electric"
            >
              <Zap className="size-3" />
              {sectionHeader}
            </motion.div>
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
          {programs.map((program, i) => {
            const badge = pickLocalized(program.level, lang);
            const title = pickLocalized(program.title, lang);
            const desc = pickLocalized(program.description, lang);
            const img = resolveCourseImage(program);
            const benefits = lookupBenefits(program);

            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedProgram(program)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-nejah-electric/30 hover:shadow-[0_0_30px_rgba(0,145,255,0.1)]"
              >
                {/* Glow on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-nejah-electric/0 via-nejah-electric/5 to-nejah-electric/0 blur-xl transition-opacity"
                />

                <div className="relative aspect-[4/3] overflow-hidden bg-nejah-midnight">
                  {img ? (
                    <>
                      <img
                        src={img}
                        alt={title}
                        loading="lazy"
                        className="size-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                    </>
                  ) : (
                    <div className="size-full flex items-center justify-center bg-gradient-to-br from-nejah-sapphire to-nejah-midnight">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <GraduationCap className="size-10 text-nejah-electric/40" />
                        <span className="text-xs font-mono tracking-wider text-nejah-electric/30">{title}</span>
                      </div>
                    </div>
                  )}
                  <span className="absolute top-3 start-3 rounded-full border border-nejah-electric/20 bg-background/90 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-nejah-electric backdrop-blur-sm">
                    {badge}
                  </span>
                </div>
                <div className="relative p-5">
                  <h3 className="mb-2 text-lg font-medium text-foreground">{title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-nejah-slate-blue line-clamp-2">{desc}</p>

                  {benefits && (
                    <ul className="mb-4 space-y-1">
                      {benefits.map((b) => (
                        <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Star className="size-3 text-nejah-electric/60" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-nejah-electric group-hover:gap-3 transition-all flex items-center gap-2">
                      {t.courses.learnMore} <ChevronRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="flex size-7 items-center justify-center rounded-full border border-nejah-electric/20 bg-nejah-electric/5 text-nejah-electric"
                    >
                      <ArrowRight className="size-3 rtl:rotate-180" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    <AnimatePresence>
      {selectedProgram && (
        <Dialog open={!!selectedProgram} onOpenChange={(open) => { if (!open) setSelectedProgram(null); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-[32px] border-nejah-electric/20 shadow-[0_0_60px_-10px_rgba(0,145,255,0.2)] bg-background">
            <CourseDetailDialog program={selectedProgram} lang={lang} onClose={() => setSelectedProgram(null)} />
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
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
  const enTitle = (program.title?.en ?? "").toLowerCase().trim();
  const meta = lookupMeta(program);
  const benefits = lookupBenefits(program);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
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
          <div className="size-full flex items-center justify-center bg-gradient-to-br from-nejah-sapphire to-nejah-midnight">
            <div className="flex flex-col items-center gap-3">
              <div className="size-16 rounded-full bg-nejah-electric/10 flex items-center justify-center">
                <GraduationCap className="size-8 text-nejah-electric" />
              </div>
              <span className="text-sm font-mono text-nejah-electric/40">{title}</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-grid-overlay opacity-[0.08]" />
        <div className="pointer-events-none absolute inset-0 scan-line opacity-[0.02]" />

        <GlowDot className="left-1/4 top-8 h-1.5 w-1.5" />
        <GlowDot className="right-1/3 top-16 h-1 w-1" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 border border-nejah-electric/10"
          style={{ transform: "rotate(45deg)" }}
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -left-6 bottom-12 h-16 w-16 rounded-full border border-nejah-electric/10"
        />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-nejah-electric/20 bg-background/90 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-nejah-electric backdrop-blur-sm mb-3">
              <Zap className="size-3" />
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
      <div className="p-6 md:p-8 space-y-8">
        {/* Stats row */}
        {meta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: Clock, label: "Duration", value: meta.duration },
              { icon: Layers, label: "Lessons", value: meta.lessons },
              { icon: Users, label: "Students", value: meta.students },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.03, y: -2 }}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-4 text-center transition-colors hover:border-nejah-electric/30 hover:shadow-[0_0_20px_rgba(0,145,255,0.08)]"
              >
                <motion.div
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="pointer-events-none absolute -right-4 -top-4 h-12 w-12 rounded-full bg-nejah-electric/10 blur-xl"
                />
                <stat.icon className="size-5 text-nejah-electric mx-auto mb-1 transition-transform duration-300 group-hover:scale-110" />
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                  {stat.label}
                </div>
                <div className="text-sm font-semibold mt-0.5">{stat.value}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Benefits row */}
        {benefits && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Award className="size-4 text-nejah-electric" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-nejah-electric">
                What You&apos;ll Gain
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-nejah-electric/20 to-transparent" />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {benefits.map((b, i) => (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05, duration: 0.3 }}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-nejah-electric/10 text-nejah-electric">
                    <Star className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{b}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-nejah-electric/20 to-transparent" />

        {/* Detailed content */}
        {detailedContent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative"
          >
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="size-4 text-nejah-electric" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-nejah-electric">
                <Sparkles className="size-3 inline me-1 -mt-0.5" />
                Course Overview
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-nejah-electric/20 to-transparent" />
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm p-5 md:p-6
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

        {/* Footer actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex gap-3 pt-2"
        >
          <Link to="/register" className="flex-1">
            <button className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-nejah-electric to-[#0066cc] px-6 py-3 font-semibold text-white shadow-[0_0_20px_rgba(0,145,255,0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,145,255,0.5)] active:scale-[0.98]">
              <span className="relative z-10 flex items-center justify-center gap-2">
                <GraduationCap className="size-5" />
                {t.cta.register}
              </span>
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]"
              />
            </button>
          </Link>
          <DialogClose asChild>
            <button className="flex-1 rounded-xl border border-border/60 bg-card/50 px-6 py-3 font-semibold text-foreground backdrop-blur-sm transition-all duration-300 hover:border-nejah-electric/30 hover:bg-card hover:shadow-[0_0_20px_rgba(0,145,255,0.08)] active:scale-[0.98]">
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
