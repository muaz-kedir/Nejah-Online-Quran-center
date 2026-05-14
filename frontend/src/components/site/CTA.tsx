import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function CTA() {
  const { t } = useTheme();
  return (
    <section className="py-12 md:py-20">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-primary text-primary-foreground rounded-3xl p-10 md:p-16 text-center overflow-hidden shadow-glow"
        >
          <div className="absolute inset-0 bg-pattern opacity-40" />
          <div className="absolute -top-20 -right-20 size-72 bg-[oklch(0.78_0.13_80/0.18)] rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-72 bg-accent/30 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.cta.title}</h2>
            <p className="text-primary-foreground/85 max-w-xl mx-auto mb-8">
              {t.cta.desc}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" className="rounded-full h-12 px-7 bg-background text-primary hover:bg-background/90">
                {t.cta.register}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-12 px-7 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t.cta.contact}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
