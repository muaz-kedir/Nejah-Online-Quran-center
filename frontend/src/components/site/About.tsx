import { BookOpen } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { useTheme } from "./ThemeProvider";
import { useHomeCms } from "./HomeCmsProvider";
import { pickLocalized, resolveCmsImageUrl } from "@/lib/home-cms";

const CARD_TONES = ["primary", "gold", "accent"] as const;

function FloatingOrb({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute animate-pulse-slow rounded-full ${className}`}
      style={{
        background:
          "radial-gradient(circle at center, rgba(0,145,255,0.2), transparent 70%)",
      }}
    />
  );
}

function GlowDot({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        background: "rgba(0,145,255,0.3)",
        boxShadow: "0 0 12px 4px rgba(0,145,255,0.2)",
      }}
    />
  );
}

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
    <section id="about" className="relative overflow-hidden py-20 md:py-28">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-grid-overlay opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-0 scan-line opacity-[0.03]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_20%,rgba(0,145,255,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(15,98,172,0.06),transparent_50%)]" />

      <FloatingOrb className="-left-16 top-1/4 h-48 w-48" />
      <FloatingOrb className="-right-12 bottom-1/4 h-36 w-36" />
      <GlowDot className="left-[20%] top-12 h-1.5 w-1.5" />
      <GlowDot className="right-[25%] top-24 h-1 w-1" />
      <GlowDot className="left-[35%] bottom-20 h-1 w-1" />
      <GlowDot className="right-[15%] bottom-12 h-1.5 w-1.5" />

      <div className="container-x relative z-10">
        <SectionHeader
          eyebrow={missionTitle}
          title={aboutHeader}
          description={aboutDescription}
        />

        {/* Mission section — glass card */}
        <div className="relative mb-16 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md md:p-12 lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,rgba(0,145,255,0.06),transparent_60%)]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.9fr] lg:gap-14">
            {/* Left — text */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-nejah-electric/30 bg-primary/15 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-nejah-electric">
                <BookOpen className="size-3.5" />
                {missionTitle}
              </div>
              <h2 className="mb-4 bg-gradient-to-r from-white via-[#C8E4FF] to-nejah-electric bg-clip-text text-2xl font-bold leading-tight tracking-tight text-transparent sm:text-3xl">
                {missionHeading}
              </h2>
              <div className="mb-4 h-px w-16 bg-gradient-to-r from-nejah-electric/50 to-transparent" />
              <p className="leading-relaxed text-white/70">
                {missionDescription}
              </p>
            </div>

            {/* Right — image */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 animate-pulse-slow rounded-[3rem] border border-nejah-electric/10" />
              <div className="pointer-events-none absolute -inset-3 rounded-[2.5rem] border border-nejah-electric/5" />
              {missionImage ? (
                <div className="relative overflow-hidden rounded-2xl ring-1 ring-nejah-electric/20 shadow-[0_0_30px_-10px_rgba(0,145,255,0.2)]">
                  <img
                    src={missionImage}
                    alt={aboutHeader}
                    className="w-full h-auto object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-nejah-sapphire/20 to-transparent" />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-nejah-electric/20 bg-white/[0.03] text-sm text-white/40">
                  No mission image
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mission cards */}
        <div className="relative grid md:grid-cols-3 gap-6">
          <div
            className="pointer-events-none absolute left-[12%] right-[12%] top-1/2 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,145,255,0.2) 15%, rgba(0,145,255,0.2) 85%, transparent)",
            }}
          />
          <div className="pointer-events-none absolute left-1/3 top-1/2 hidden size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nejah-electric/40 shadow-[0_0_6px_2px_rgba(0,145,255,0.15)] md:block" />
          <div className="pointer-events-none absolute left-2/3 top-1/2 hidden size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nejah-electric/40 shadow-[0_0_6px_2px_rgba(0,145,255,0.15)] md:block" />

          {missionCards.map((card, i) => {
            const title = pickLocalized(card.title, lang);
            const desc = pickLocalized(card.description, lang);
            const iconUrl = resolveCmsImageUrl(card.iconUrl);
            const tone = CARD_TONES[i % CARD_TONES.length];

            const toneStyles = {
              primary: {
                bg: "from-nejah-electric/20 to-primary/10",
                text: "text-nejah-electric",
                shadow: "rgba(0,145,255,0.15)",
              },
              gold: {
                bg: "from-amber-400/20 to-orange-500/10",
                text: "text-amber-500",
                shadow: "rgba(251,191,36,0.15)",
              },
              accent: {
                bg: "from-emerald-400/20 to-green-500/10",
                text: "text-emerald-500",
                shadow: "rgba(52,211,153,0.15)",
              },
            }[tone];

            return (
              <div
                key={card.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md transition-all duration-300 hover:border-nejah-electric/40 hover:bg-white/[0.08] hover:shadow-[0_0_40px_rgba(0,145,255,0.12)]"
              >
                <div className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 bg-[radial-gradient(circle_at_center,rgba(0,145,255,0.06),transparent_60%)] transition-opacity duration-500 group-hover:opacity-100" />

                <div
                  className={`mb-5 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${toneStyles.bg} ${toneStyles.text} shadow-[inset_0_0_10px_${toneStyles.shadow}] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_${toneStyles.shadow}]`}
                >
                  {iconUrl ? (
                    <img src={iconUrl} alt="" className="size-6 object-contain" />
                  ) : (
                    <BookOpen className="size-6" />
                  )}
                </div>

                <h3 className="mb-2 text-lg font-bold text-white transition-colors duration-300 group-hover:text-nejah-electric">
                  {title}
                </h3>

                <div className="mb-3 h-px w-8 bg-gradient-to-r from-transparent via-nejah-electric/20 to-transparent transition-all duration-300 group-hover:w-12 group-hover:via-nejah-electric/40" />

                <p className="text-sm leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/80">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
