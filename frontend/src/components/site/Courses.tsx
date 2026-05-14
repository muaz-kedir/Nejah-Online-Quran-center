import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
            <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">
              {t.courses.eyebrow}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t.courses.title}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
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
              className="bg-card rounded-3xl overflow-hidden border border-border shadow-soft hover:shadow-elevated transition-all group"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  className="size-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <span className="absolute top-3 start-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-background/95 text-primary backdrop-blur">
                  {c.badge}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{c.desc}</p>
                <button className="w-full h-10 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground text-sm font-semibold transition-colors">
                  {t.courses.learnMore}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
