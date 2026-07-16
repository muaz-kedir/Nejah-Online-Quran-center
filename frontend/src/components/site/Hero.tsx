import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";

export function Hero() {
  const { t } = useTheme();
  const courses = t.hero.title1Courses.split("|");
  const [displayedText, setDisplayedText] = useState("");
  const idxRef = useRef(0);
  const charRef = useRef(0);

  useEffect(() => {
    let active = true;

    const schedule = () => {
      if (!active) return;
      const word = courses[idxRef.current];

      if (charRef.current < word.length) {
        charRef.current++;
        setDisplayedText(word.slice(0, charRef.current));
        setTimeout(schedule, 80);
      } else {
        setTimeout(() => {
          if (!active) return;
          charRef.current = 0;
          setDisplayedText("");
          idxRef.current = (idxRef.current + 1) % courses.length;
          setTimeout(schedule, 400);
        }, 2000);
      }
    };

    setTimeout(schedule, 400);

    return () => { active = false; };
  }, [courses.length]);
  return (
    <section id="home" className="relative overflow-hidden pb-20 pt-28 md:pt-36">
      {/* Background layers */}
      <div className="absolute inset-0 bg-pattern pointer-events-none" />
      <div className="absolute inset-0 bg-grid-overlay opacity-[0.06] pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
        {/* Left — copy */}
        <div className="relative">
          <div className="hero-glow-blob" />

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-nejah-electric/20 bg-primary/10 px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-nejah-electric">
            <Sparkles className="size-3.5" />
            {t.hero.badge}
          </div>

          {/* Heading */}
          <h1 className="heading-premium text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-6">
            {t.hero.title1Prefix}<span className="text-gradient inline-flex items-baseline">
              <span>{displayedText}</span>
              <span className="ml-0.5 inline-block w-[3px] h-[1em] rounded-full bg-nejah-electric animate-pulse" />
            </span><br />
            {t.hero.title2}{" "}
            <span className="text-gradient">{t.hero.title3}</span>
          </h1>

          {/* Accent line */}
          <div className="mb-6 h-px w-20 bg-gradient-to-r from-nejah-electric to-transparent" />

          {/* Description */}
          <p className="mb-8 max-w-xl text-base leading-relaxed text-nejah-slate-blue md:text-lg">
            {t.hero.desc}
          </p>

          {/* Buttons */}
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

          {/* Stats row */}
          <div className="flex items-center gap-8">
            {/* Avatars */}
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="size-10 rounded-full border-2 border-background"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.${5 + i} 0.13 ${100 + i * 30}), oklch(0.6 0.1 155))`,
                  }}
                />
              ))}
            </div>
            {/* Text stats */}
            <div className="flex items-center gap-8">
              <div>
                <div className="font-bold text-lg">2,000+</div>
                <div className="text-xs text-muted-foreground">{t.hero.students}</div>
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-lg">120+</div>
                <div className="text-xs text-muted-foreground">Teachers</div>
              </div>
              <div>
                <div className="font-bold text-lg">24/7</div>
                <div className="text-xs text-muted-foreground">Live classes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — image */}
        <div className="relative">
          {/* Decorative ring behind image */}
          <div
            className="pointer-events-none absolute -inset-8 animate-pulse-slow rounded-[3rem] border border-nejah-electric/10"
          />
          <div
            className="pointer-events-none absolute -inset-4 rounded-[2.5rem] border border-nejah-electric/5"
          />

          {/* Image container with glow border */}
          <div className="relative rounded-3xl overflow-hidden shadow-elevated ring-1 ring-nejah-electric/20 transition-all duration-500 hover:ring-nejah-electric/40">
            <img
              src="/Nejah-1.png"
              alt="Nejah Online Quran Center"
              className="w-full h-auto object-cover"
              fetchPriority="high"
            />
            {/* Subtle gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-nejah-sapphire/20 to-transparent" />
          </div>

          {/* Floating stat card — Students */}
          <div className="glass-panel absolute -left-4 top-10 flex max-w-[200px] items-center gap-3 rounded-2xl p-3 animate-float shadow-[0_0_20px_rgba(0,145,255,0.08)]" style={{ animationDuration: "4s" }}>
            <div className="size-10 rounded-xl bg-gradient-to-br from-nejah-electric/20 to-primary/10 text-nejah-electric grid place-items-center shadow-[inset_0_0_10px_rgba(0,145,255,0.1)]">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.hero.studentsLabel}</div>
              <div className="font-bold text-foreground">2,400+</div>
            </div>
          </div>

          {/* Floating stat card — Teachers */}
          <div className="glass-panel absolute -right-2 top-1/3 flex max-w-[210px] items-center gap-3 rounded-2xl p-3 animate-float shadow-[0_0_20px_rgba(0,145,255,0.08)]" style={{ animationDuration: "5s", animationDelay: "0.5s" }}>
            <div className="size-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 text-amber-500 grid place-items-center shadow-[inset_0_0_10px_rgba(251,191,36,0.1)]">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.hero.teachersLabel}</div>
              <div className="font-bold text-foreground">120+</div>
            </div>
          </div>

          {/* Floating stat card — Live */}
          <div className="glass-panel absolute -bottom-4 right-8 flex items-center gap-3 rounded-2xl p-3 animate-float shadow-[0_0_20px_rgba(0,145,255,0.08)]" style={{ animationDuration: "4.5s", animationDelay: "1s" }}>
            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-green-500/10 text-emerald-500 grid place-items-center shadow-[inset_0_0_10px_rgba(52,211,153,0.1)]">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h10.5a2.25 2.25 0 0 0 2.25-2.25V7.5a2.25 2.25 0 0 0-2.25-2.25H4.5A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.hero.liveLabel}</div>
              <div className="font-bold text-foreground">24 / 7</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
