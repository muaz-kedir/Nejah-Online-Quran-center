import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import quranImg from "@/assets/course-quran.jpg";
import tajweedImg from "@/assets/course-tajweed.jpg";
import hifzImg from "@/assets/course-hifz.jpg";
import islamicImg from "@/assets/course-islamic.jpg";
import { useTheme } from "./ThemeProvider";

export function Courses() {
  const { t } = useTheme();
  const courses = [
    { img: quranImg, badge: t.courses.beginner, title: t.courses.c1Title, desc: t.courses.c1Desc },
    { img: tajweedImg, badge: t.courses.intermediate, title: t.courses.c2Title, desc: t.courses.c2Desc },
    { img: hifzImg, badge: t.courses.advanced, title: t.courses.c3Title, desc: t.courses.c3Desc },
    { img: islamicImg, badge: t.courses.allLevels, title: t.courses.c4Title, desc: t.courses.c4Desc },
  ];
  return (
    <section id="courses" className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-electric">
              {t.courses.eyebrow}
            </div>
            <h2 className="mb-4 text-3xl font-medium tracking-tight text-brand-silver md:text-4xl lg:text-5xl">
              {t.courses.title}
            </h2>
            <p className="text-base text-brand-platinum md:text-lg">
              {t.courses.desc}
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
          >
            {t.courses.viewAll} <ArrowRight className="size-4 rtl:rotate-180" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="glass-panel group overflow-hidden rounded-3xl transition-all hover:border-brand-electric/30"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  className="size-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <span className="absolute top-3 start-3 rounded-full border border-brand-electric/20 bg-brand-void/90 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-brand-electric backdrop-blur">
                  {c.badge}
                </span>
              </div>
              <div className="p-5">
                <h3 className="mb-2 text-lg font-medium text-brand-silver">{c.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-brand-platinum">{c.desc}</p>
                <Button
                  variant="outline"
                  className="h-10 w-full rounded-full border-brand-electric/30 text-sm font-semibold text-brand-electric hover:border-brand-electric hover:bg-brand-electric hover:text-white hover:shadow-[0_0_16px_rgba(0,102,204,0.35)]"
                >
                  {t.courses.learnMore}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
