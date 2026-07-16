import { ArrowRight, Bookmark, CalendarCheck, UserPlus } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const stepIcons = [UserPlus, CalendarCheck, Bookmark];

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

export function HowItWorks() {
  const { t } = useTheme();
  const steps = [
    { icon: UserPlus, title: t.how.s1Title, desc: t.how.s1Desc },
    { icon: CalendarCheck, title: t.how.s2Title, desc: t.how.s2Desc },
    { icon: Bookmark, title: t.how.s3Title, desc: t.how.s3Desc },
  ];
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-nejah-sapphire via-[#0a1e4a] to-nejah-midnight" />
      <div className="pointer-events-none absolute inset-0 bg-grid-overlay opacity-[0.12] dark:opacity-[0.15]" />
      <div className="pointer-events-none absolute inset-0 scan-line opacity-[0.04]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_30%,rgba(0,145,255,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_70%,rgba(15,98,172,0.08),transparent_50%)]" />

      {/* Orbs */}
      <FloatingOrb className="-left-20 top-1/4 h-56 w-56" />
      <FloatingOrb className="-right-16 bottom-1/3 h-40 w-40" />

      {/* Glow dots */}
      <GlowDot className="left-[15%] top-16 h-1.5 w-1.5" />
      <GlowDot className="right-[20%] top-20 h-1 w-1" />
      <GlowDot className="left-[40%] bottom-20 h-1 w-1" />
      <GlowDot className="right-[30%] bottom-12 h-1.5 w-1.5" />

      <div className="container-x relative z-10">
        {/* Heading */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-nejah-electric/30 bg-primary/15 px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-nejah-electric">
            <span className="size-1.5 rounded-full bg-nejah-electric animate-pulse" />
            Your Path
          </div>
          <h2 className="bg-gradient-to-r from-white via-[#C8E4FF] to-nejah-electric bg-clip-text text-3xl font-bold leading-tight tracking-tight text-transparent md:text-4xl lg:text-5xl">
            {t.how.title}
          </h2>
          <div className="mx-auto mt-4 h-px max-w-xs bg-gradient-to-r from-transparent via-nejah-electric/40 to-transparent" />
        </div>

        {/* Steps */}
        <div className="relative mx-auto grid max-w-5xl gap-6 md:grid-cols-3 md:gap-8">
          {/* Connecting line */}
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-20 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,145,255,0.3) 15%, rgba(0,145,255,0.3) 85%, transparent)",
            }}
          />

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-md transition-all duration-300 hover:border-nejah-electric/40 hover:bg-white/[0.08] hover:shadow-[0_0_40px_rgba(0,145,255,0.15)] md:p-8"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 bg-[radial-gradient(circle_at_center,rgba(0,145,255,0.08),transparent_60%)] transition-opacity duration-500 group-hover:opacity-100" />

                {/* Step number badge */}
                <div className="absolute right-3 top-3 font-mono text-[11px] font-bold tracking-wider text-white/15">
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Icon container */}
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-nejah-electric/30 bg-primary/15 text-nejah-electric shadow-[0_0_15px_rgba(0,145,255,0.15)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(0,145,255,0.3)]">
                  <Icon className="size-7 transition-transform duration-300 group-hover:rotate-3" />
                </div>

                {/* Step title */}
                <h3 className="mb-2 font-display text-lg font-bold text-white transition-colors duration-300 group-hover:text-nejah-electric md:text-xl">
                  {s.title}
                </h3>

                {/* Decorative divider */}
                <div className="mx-auto mb-3 h-px w-8 bg-gradient-to-r from-transparent via-nejah-electric/30 to-transparent transition-all duration-300 group-hover:w-12 group-hover:via-nejah-electric/60" />

                {/* Description */}
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/80">
                  {s.desc}
                </p>

                {/* Arrow indicator (last step hidden) */}
                {i < steps.length - 1 && (
                  <ArrowRight className="mx-auto mt-4 size-4 text-nejah-electric/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-nejah-electric/60 md:hidden" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
