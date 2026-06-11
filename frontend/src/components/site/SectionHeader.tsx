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
        <div className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-electric">
          {eyebrow}
        </div>
      )}
      <h2 className="mb-4 text-3xl font-medium tracking-tight text-brand-silver md:text-4xl lg:text-5xl">{title}</h2>
      {description && (
        <p className="text-base leading-relaxed text-brand-platinum md:text-lg">{description}</p>
      )}
    </motion.div>
  );
}
