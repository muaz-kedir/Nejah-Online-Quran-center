import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Testimonials() {
  const { t } = useTheme();
  const reviews = [
    { name: t.testimonials.r1Name, role: t.testimonials.r1Role, text: t.testimonials.r1Text },
    { name: t.testimonials.r2Name, role: t.testimonials.r2Role, text: t.testimonials.r2Text },
    { name: t.testimonials.r3Name, role: t.testimonials.r3Role, text: t.testimonials.r3Text },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const tm = setInterval(() => setI((p) => (p + 1) % reviews.length), 6000);
    return () => clearInterval(tm);
  }, [reviews.length]);

  return (
    <section id="testimonials" className="py-20 md:py-28">
      <div className="container-x max-w-3xl">
        <div className="glass-panel relative overflow-hidden rounded-3xl p-8 md:p-12">
          <Quote className="absolute top-6 end-6 size-16 text-primary/10" />
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="size-5 fill-[oklch(0.78_0.13_80)] text-[oklch(0.78_0.13_80)]" />
            ))}
          </div>
          <div className="relative min-h-[180px] md:min-h-[140px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-lg md:text-xl font-medium leading-relaxed mb-6">
                  "{reviews[i].text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">
                    {reviews[i].name[0]}
                  </div>
                  <div>
                    <div className="font-bold">{reviews[i].name}</div>
                    <div className="text-xs text-muted-foreground">{reviews[i].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex gap-2 mt-8">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Show review ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-8 bg-primary" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
