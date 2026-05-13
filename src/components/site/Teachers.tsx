import { motion } from "framer-motion";
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
    <section id="teachers" className="py-20 md:py-28 bg-muted/40">
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
              className="bg-card rounded-3xl p-7 border border-border shadow-soft hover:shadow-elevated text-center transition-all"
            >
              <div className="relative mx-auto mb-5 w-fit">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                <img
                  src={tc.img}
                  alt={tc.name}
                  loading="lazy"
                  className="relative size-24 rounded-full object-cover ring-4 ring-background"
                />
              </div>
              <h3 className="font-bold text-lg">{tc.name}</h3>
              <div className="text-sm text-primary font-semibold mb-3">{tc.spec}</div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{tc.exp}</p>
              <button className="w-full h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors">
                {t.teachers.bookTrial}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
