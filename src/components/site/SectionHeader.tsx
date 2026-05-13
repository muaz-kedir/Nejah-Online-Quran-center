import { motion } from "framer-motion";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export function SectionHeader({ eyebrow, title, description, align = "center" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={`max-w-2xl mb-12 ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      {eyebrow && (
        <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-3">
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h2>
      {description && (
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}
