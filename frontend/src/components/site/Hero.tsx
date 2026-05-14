import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, Users, GraduationCap, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-quran.jpg";
import { useTheme } from "./ThemeProvider";

export function Hero() {
  const { t } = useTheme();
  return (
    <section id="home" className="relative pt-28 md:pt-36 pb-20 overflow-hidden bg-pattern">
      <div className="container-x grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-semibold mb-6">
            <Sparkles className="size-3.5" />
            {t.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] mb-6">
            {t.hero.title1}<br />
            {t.hero.title2}{" "}
            <span className="text-gradient">{t.hero.title3}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
            {t.hero.desc}
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 shadow-elevated h-12 px-6">
              {t.hero.getStarted} <ArrowRight className="ms-1 size-4 rtl:rotate-180" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-12 px-6">
              <PlayCircle className="me-1 size-4" /> {t.hero.bookTrial}
            </Button>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="size-9 rounded-full border-2 border-background"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.${5 + i} 0.13 ${100 + i * 30}), oklch(0.6 0.1 155))`,
                  }}
                />
              ))}
            </div>
            <div>
              <div className="font-bold text-lg">2,000+</div>
              <div className="text-xs text-muted-foreground">{t.hero.students}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-elevated">
            <img
              src={heroImg}
              alt="Open Quran with Islamic patterns"
              width={1024}
              height={1024}
              className="w-full h-auto"
            />
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -left-4 top-10 bg-card border border-border rounded-2xl p-3 shadow-elevated flex items-center gap-3 max-w-[200px]"
          >
            <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Users className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.hero.studentsLabel}</div>
              <div className="font-bold">2,400+</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-2 top-1/3 bg-card border border-border rounded-2xl p-3 shadow-elevated flex items-center gap-3 max-w-[210px]"
          >
            <div className="size-10 rounded-xl bg-[oklch(0.78_0.13_80/0.15)] text-[oklch(0.6_0.13_80)] grid place-items-center">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.hero.teachersLabel}</div>
              <div className="font-bold">120+</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-4 right-8 bg-card border border-border rounded-2xl p-3 shadow-elevated flex items-center gap-3"
          >
            <div className="size-10 rounded-xl bg-accent/15 text-accent grid place-items-center">
              <Video className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.hero.liveLabel}</div>
              <div className="font-bold">24 / 7</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
