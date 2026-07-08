import { motion } from "framer-motion";
import { GraduationCap, UserRound, CalendarClock, BookOpen } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { useTheme } from "./ThemeProvider";
import { useHomeCms } from "./HomeCmsProvider";
import { pickLocalized, resolveCmsImageUrl } from "@/lib/home-cms";

const CARD_ICONS = [GraduationCap, UserRound, CalendarClock];
const CARD_TONES = ["primary", "gold", "accent"] as const;

export function About() {
  const { lang } = useTheme();
  const { missionSection, missionCards, loading } = useHomeCms();

  if (loading || !missionSection) {
    return (
      <section id="about" className="py-20 md:py-28">
        <div className="container-x">
          <div className="h-48 rounded-3xl bg-muted/30 animate-pulse" />
        </div>
      </section>
    );
  }

  const aboutHeader = pickLocalized(missionSection.aboutHeader, lang);
  const aboutDescription = pickLocalized(missionSection.aboutDescription, lang);
  const missionTitle = pickLocalized(missionSection.missionTitle, lang);
  const missionHeading = pickLocalized(missionSection.missionHeading, lang);
  const missionDescription = pickLocalized(missionSection.missionDescription, lang);
  const missionImage = resolveCmsImageUrl(missionSection.missionImageUrl);

  return (
    <section id="about" className="py-20 md:py-28">
      <div className="container-x">
        <SectionHeader
          eyebrow={missionTitle}
          title={aboutHeader}
          description={aboutDescription}
        />

        <div className="grid lg:grid-cols-2 gap-10 items-center mb-14">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary mb-4">
              <BookOpen className="size-3.5" />
              {missionTitle}
            </div>
            <h2 className="heading-premium text-2xl sm:text-3xl mb-4">{missionHeading}</h2>
            <p className="text-muted-foreground leading-relaxed">{missionDescription}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            {missionImage ? (
              <div className="rounded-3xl overflow-hidden shadow-elevated">
                <img
                  src={missionImage}
                  alt={aboutHeader}
                  className="w-full h-auto object-cover"
                />
              </div>
            ) : (
              <div className="rounded-3xl h-64 bg-muted/40 flex items-center justify-center text-muted-foreground text-sm">
                No mission image
              </div>
            )}
          </motion.div>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6">
          <div className="data-line-h top-1/2 left-[12%] right-[12%] md:block" />
          <div className="data-line-dot top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 md:block" />
          <div className="data-line-dot top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 md:block" />
          {missionCards.map((card, i) => {
            const title = pickLocalized(card.title, lang);
            const desc = pickLocalized(card.description, lang);
            const iconUrl = resolveCmsImageUrl(card.iconUrl);
            const Icon = CARD_ICONS[i % CARD_ICONS.length];
            const tone = CARD_TONES[i % CARD_TONES.length];

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="glass-panel rounded-3xl p-7 transition-all hover:border-nejah-electric/30"
              >
                <div
                  className={`size-12 rounded-2xl grid place-items-center mb-5 ${
                    tone === "primary"
                      ? "bg-primary/10 text-primary"
                      : tone === "gold"
                        ? "bg-[oklch(0.78_0.13_80/0.15)] text-[oklch(0.55_0.13_80)]"
                        : "bg-accent/15 text-accent"
                  }`}
                >
                  {iconUrl ? (
                    <img src={iconUrl} alt="" className="size-6 object-contain" />
                  ) : (
                    <Icon className="size-6" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
