import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./SectionHeader";
import t1 from "@/assets/teacher-1.jpg";
import t2 from "@/assets/teacher-2.jpg";
import t3 from "@/assets/teacher-3.jpg";
import { useTheme } from "./ThemeProvider";

export function Teachers() {
  const { t } = useTheme();
  const teachers = [
    { img: t1, name: t.teachers.t1Name, spec: t.teachers.t1Spec, exp: t.teachers.t1Exp },
    { img: t2, name: t.teachers.t2Name, spec: t.teachers.t2Spec, exp: t.teachers.t2Exp },
    { img: t3, name: t.teachers.t3Name, spec: t.teachers.t3Spec, exp: t.teachers.t3Exp },
  ];
  return (
    <section id="teachers" className="py-20 md:py-28">
      <div className="container-x">
        <SectionHeader title={t.teachers.title} />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {teachers.map((tc, i) => (
            <motion.div
              key={tc.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-panel rounded-3xl p-7 text-center transition-all hover:border-brand-electric/30"
            >
              <div className="relative mx-auto mb-5 w-fit">
                <div className="absolute inset-0 rounded-full bg-brand-electric/20 blur-xl" />
                <img
                  src={tc.img}
                  alt={tc.name}
                  loading="lazy"
                  className="relative size-24 rounded-full object-cover ring-4 ring-brand-void"
                />
              </div>
              <h3 className="text-lg font-medium text-brand-silver">{tc.name}</h3>
              <div className="mb-3 text-sm font-semibold text-brand-electric">{tc.spec}</div>
              <p className="mb-5 text-sm leading-relaxed text-brand-platinum">{tc.exp}</p>
              <Button className="h-11 w-full rounded-full font-semibold shadow-[0_0_16px_rgba(0,102,204,0.35)]">
                {t.teachers.bookTrial}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
