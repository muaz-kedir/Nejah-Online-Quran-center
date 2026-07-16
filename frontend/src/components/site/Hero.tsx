import { ArrowRight, PlayCircle, Sparkles, Users, GraduationCap, Video } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTheme } from "./ThemeProvider";

export function Hero() {
  const { t } = useTheme();
  return (
    <section id="home" className="relative overflow-hidden bg-pattern pb-20 pt-28 md:pt-36">
      {/* Futuristic overlay (both themes) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="scan-line" />
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
        <div className="vignette-glow" />
        <div className="grid-glow-dot" style={{ top: '20%', left: '15%' }} />
        <div className="grid-glow-dot" style={{ top: '45%', left: '75%' }} />
        <div className="grid-glow-dot" style={{ top: '70%', left: '40%' }} />
        <div className="grid-glow-dot" style={{ top: '85%', left: '85%' }} />
        <div className="grid-glow-dot" style={{ top: '10%', left: '60%' }} />
        <div className="data-line-h" style={{ top: '35%', left: '10%', width: '25%' }} />
        <div className="data-line-v" style={{ top: '15%', left: '50%', height: '30%' }} />
        <div className="data-line-dot" style={{ top: '35%', left: '50%' }} />
      </div>

      <div className="container-x grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="relative">
          <div className="hero-glow-blob" />
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-nejah-electric/20 bg-primary/10 px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-nejah-electric">
            <Sparkles className="size-3.5" />
            {t.hero.badge}
          </div>
          <h1 className="heading-premium text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-6">
            {t.hero.title1}<br />
            {t.hero.title2}{" "}
            <span className="text-gradient">{t.hero.title3}</span>
          </h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-nejah-slate-blue md:text-lg">
            {t.hero.desc}
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <Link to="/register">
              <button className="btn-metallic">
                <span>{t.hero.getStarted} <ArrowRight className="ms-1 size-4 rtl:rotate-180 inline" /></span>
              </button>
            </Link>
            <button className="btn-metallic-outline">
              <span><PlayCircle className="me-1 size-4 inline" /> {t.hero.bookTrial}</span>
            </button>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="size-9 rounded-full border-2 border-background"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.${5 + i} 0.13 ${100 + i * 30}), oklch(0.6 0.1 155))`,
                  }}
                />
              ))}
            </div>
            <div>
              <div className="font-bold text-lg">2,000+</div>
              <div className="text-xs text-muted-foreground">{t.hero.students}</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-elevated">
            <img
              src="/Nejah-1.png"
              alt="Nejah Online Quran Center"
              className="w-full h-auto object-cover"
              fetchpriority="high"
            />
          </div>

          <div className="glass-panel absolute -left-4 top-10 flex max-w-[200px] items-center gap-3 rounded-2xl p-3 animate-float" style={{ animationDuration: "4s" }}>
            <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Users className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.hero.studentsLabel}</div>
              <div className="font-bold">2,400+</div>
            </div>
          </div>

          <div className="glass-panel absolute -right-2 top-1/3 flex max-w-[210px] items-center gap-3 rounded-2xl p-3 animate-float" style={{ animationDuration: "5s", animationDelay: "0.5s" }}>
            <div className="size-10 rounded-xl bg-[oklch(0.78_0.13_80/0.15)] text-[oklch(0.6_0.13_80)] grid place-items-center">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.hero.teachersLabel}</div>
              <div className="font-bold">120+</div>
            </div>
          </div>

          <div className="glass-panel absolute -bottom-4 right-8 flex items-center gap-3 rounded-2xl p-3 animate-float" style={{ animationDuration: "4.5s", animationDelay: "1s" }}>
            <div className="size-10 rounded-xl bg-accent/15 text-accent grid place-items-center">
              <Video className="size-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t.hero.liveLabel}</div>
              <div className="font-bold">24 / 7</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
