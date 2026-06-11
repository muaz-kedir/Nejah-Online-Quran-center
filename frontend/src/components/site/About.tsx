import { motion } from "framer-motion";
import { GraduationCap, UserRound, CalendarClock } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { useTheme } from "./ThemeProvider";

export function About() {
  const { t } = useTheme();
  const features = [
    { icon: GraduationCap, title: t.about.f1Title, desc: t.about.f1Desc, tone: "primary" },
    { icon: UserRound, title: t.about.f2Title, desc: t.about.f2Desc, tone: "gold" },
    { icon: CalendarClock, title: t.about.f3Title, desc: t.about.f3Desc, tone: "accent" },
  ];

  return (
    <section id="about" className="py-20 md:py-28">
      <div className="container-x">
        <SectionHeader
          eyebrow={t.about.eyebrow}
          title={t.about.title}
          description={t.about.desc}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="glass-panel rounded-3xl p-7 transition-all hover:border-brand-electric/30"
            >
              <div
                className={`size-12 rounded-2xl grid place-items-center mb-5 ${
                  f.tone === "primary"
                    ? "bg-primary/10 text-primary"
                    : f.tone === "gold"
                    ? "bg-[oklch(0.78_0.13_80/0.15)] text-[oklch(0.55_0.13_80)]"
                    : "bg-accent/15 text-accent"
                }`}
              >
                <f.icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
