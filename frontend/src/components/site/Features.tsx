import { motion } from "framer-motion";
import { Video, Users2, LineChart, Eye, Clapperboard, FileText } from "lucide-react";
import dashImg from "@/assets/dashboard-preview.jpg";
import { useTheme } from "./ThemeProvider";

export function Features() {
  const { t } = useTheme();
  const items = [
    { icon: Video, title: t.features.f1Title, desc: t.features.f1Desc },
    { icon: Users2, title: t.features.f2Title, desc: t.features.f2Desc },
    { icon: LineChart, title: t.features.f3Title, desc: t.features.f3Desc },
    { icon: Eye, title: t.features.f4Title, desc: t.features.f4Desc },
    { icon: Clapperboard, title: t.features.f5Title, desc: t.features.f5Desc },
    { icon: FileText, title: t.features.f6Title, desc: t.features.f6Desc },
  ];
  return (
    <section className="py-20 md:py-28">
      <div className="container-x grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">
            {t.features.eyebrow}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-10">
            {t.features.title1}<br />{t.features.title2}
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-7">
            {items.map((it, i) => (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3"
              >
                <div className="shrink-0 size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <it.icon className="size-5" />
                </div>
                <div>
                  <div className="font-bold mb-1">{it.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -inset-6 bg-primary/10 rounded-[2.5rem] blur-2xl" />
          <img
            src={dashImg}
            alt="Nejah dashboard preview"
            loading="lazy"
            className="glass-panel relative w-full rounded-3xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
