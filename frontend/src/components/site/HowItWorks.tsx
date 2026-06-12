import { motion } from "framer-motion";
import { UserPlus, CalendarCheck, BookOpenCheck } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function HowItWorks() {
  const { t } = useTheme();
  const steps = [
    { icon: UserPlus, title: t.how.s1Title, desc: t.how.s1Desc },
    { icon: CalendarCheck, title: t.how.s2Title, desc: t.how.s2Desc },
    { icon: BookOpenCheck, title: t.how.s3Title, desc: t.how.s3Desc },
  ];
  return (
    <section className="relative overflow-hidden bg-nejah-sapphire py-20 text-white md:py-28">
      <div className="absolute inset-0 bg-pattern opacity-30" />
      <div className="container-x relative">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16"
        >
          {t.how.title}
        </motion.h2>

        <div className="relative grid md:grid-cols-3 gap-10 md:gap-6">
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-primary-foreground/30" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="size-16 mx-auto mb-5 rounded-2xl bg-primary-foreground/15 backdrop-blur grid place-items-center border border-primary-foreground/20">
                <s.icon className="size-7" />
              </div>
              <div className="font-display font-bold text-xl mb-2">
                {i + 1}. {s.title}
              </div>
              <p className="text-sm text-primary-foreground/75 max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
