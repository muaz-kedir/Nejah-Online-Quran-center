import { ChevronRight, BookOpen, Star, Layers, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface LevelProgressData {
  learningTrack: "qaidah" | "quran_reading" | "tajweed" | "hifz";
  learningTrackLabel: string;
  studentLevel: string;
  progressSummary: {
    completed: number;
    total: number;
    remaining: number;
    percentage: number;
  };
  currentTopic: {
    id: string;
    nameEn: string;
    nameAr: string;
    order: number;
    label: string;
  } | null;
  lastPosition: {
    surahNumber: number | null;
    lastStudiedSurah: string | null;
    lastStudiedPage: number | null;
    lastStudiedAyah: number | null;
    currentTopicId: string | null;
  };
  progress: {
    progressPercentage: number;
    rank: string;
    surahsCount: number;
    ayahsCount: number;
  };
}

interface LevelProgressCardProps {
  levelProgress: LevelProgressData;
  /** Legacy flat progress from the dashboard (used as fallback for hifz juz count) */
  legacyProgress?: any;
  onViewProgress: () => void;
}

const TRACK_CONFIG: Record<
  string,
  {
    title: string;
    icon: typeof BookOpen;
    gradientClass: string;
    accentColor: string;
  }
> = {
  qaidah: {
    title: "Qaida Progress",
    icon: BookOpen,
    gradientClass:
      "bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent dark:from-emerald-500/10 dark:via-teal-500/5",
    accentColor: "text-emerald-600 dark:text-emerald-400",
  },
  quran_reading: {
    title: "Quran Reading Progress",
    icon: BookOpenCheck,
    gradientClass:
      "bg-gradient-to-r from-blue-500/20 via-sky-500/10 to-transparent dark:from-blue-500/10 dark:via-sky-500/5",
    accentColor: "text-blue-600 dark:text-blue-400",
  },
  tajweed: {
    title: "Tajweed Progress",
    icon: Layers,
    gradientClass:
      "bg-gradient-to-r from-purple-500/20 via-violet-500/10 to-transparent dark:from-purple-500/10 dark:via-violet-500/5",
    accentColor: "text-purple-600 dark:text-purple-400",
  },
  hifz: {
    title: "Hifz Progress",
    icon: Star,
    gradientClass:
      "bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent dark:from-amber-500/10 dark:via-orange-500/5",
    accentColor: "text-amber-600 dark:text-amber-400",
  },
};

const PROGRESS_BAR_COLORS: Record<string, string> = {
  qaidah:
    "bg-gradient-to-r from-emerald-500 to-teal-400",
  quran_reading:
    "bg-gradient-to-r from-blue-500 to-sky-400",
  tajweed:
    "bg-gradient-to-r from-purple-500 to-violet-400",
  hifz: "progress-gradient",
};

/* ─── Sub-components for each learning track ─── */

function QaidaCard({
  levelProgress,
}: {
  levelProgress: LevelProgressData;
}) {
  const { progressSummary, currentTopic } = levelProgress;
  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            Current Topic
          </p>
          <p
            className="font-bold text-foreground text-sm leading-snug"
            dir="rtl"
          >
            {currentTopic?.nameAr || "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {currentTopic?.nameEn || ""}
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">
            {progressSummary.completed}{" "}
            <span className="text-sm text-muted-foreground font-medium">
              / {progressSummary.total}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Completed
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">
            {progressSummary.remaining}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Remaining
          </p>
        </div>
      </div>
    </>
  );
}

function QuranReadingCard({
  levelProgress,
}: {
  levelProgress: LevelProgressData;
}) {
  const { progressSummary, lastPosition, progress } = levelProgress;
  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            Current Surah
          </p>
          <p className="font-bold text-foreground text-sm leading-snug">
            {lastPosition.lastStudiedSurah || "Not started"}
          </p>
          {lastPosition.lastStudiedAyah ? (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Ayah {lastPosition.lastStudiedAyah}
            </p>
          ) : null}
        </div>
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">
            {progressSummary.completed}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Surahs
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">
            {progress.ayahsCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Ayahs
          </p>
        </div>
      </div>
    </>
  );
}

function TajweedCard({
  levelProgress,
}: {
  levelProgress: LevelProgressData;
}) {
  const { progressSummary, currentTopic } = levelProgress;
  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
            Current Rule
          </p>
          <p
            className="font-bold text-foreground text-sm leading-snug"
            dir="rtl"
          >
            {currentTopic?.nameAr || "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {currentTopic?.nameEn || ""}
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">
            {progressSummary.completed}{" "}
            <span className="text-sm text-muted-foreground font-medium">
              / {progressSummary.total}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Lessons
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">
            {progressSummary.remaining}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Remaining
          </p>
        </div>
      </div>
    </>
  );
}

function HifzCard({
  levelProgress,
  legacyProgress,
}: {
  levelProgress: LevelProgressData;
  legacyProgress?: any;
}) {
  const { progressSummary, lastPosition, progress } = levelProgress;
  const juzCount =
    legacyProgress?.completedJuz ?? Math.floor(progress.surahsCount / 4);
  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">
            {progressSummary.completed}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Surahs
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">
            {progress.ayahsCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Ayahs
          </p>
        </div>
        <div className="stat-card text-center">
          <p className="font-bold text-xl text-foreground">{juzCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Juz</p>
        </div>
      </div>
    </>
  );
}

/* ─── Main component ─── */

export function LevelProgressCard({
  levelProgress,
  legacyProgress,
  onViewProgress,
}: LevelProgressCardProps) {
  const track = levelProgress.learningTrack;
  const config = TRACK_CONFIG[track] || TRACK_CONFIG.hifz;
  const Icon = config.icon;
  const percentage = levelProgress.progressSummary.percentage;
  const rank = levelProgress.progress.rank;

  // Subtitle based on track type
  const subtitle = (() => {
    switch (track) {
      case "qaidah":
        return levelProgress.currentTopic
          ? `${levelProgress.currentTopic.nameEn}`
          : "Not started yet";
      case "quran_reading":
        return levelProgress.lastPosition.lastStudiedSurah
          ? `${levelProgress.lastPosition.lastStudiedSurah} · Ayah ${levelProgress.lastPosition.lastStudiedAyah || 0}`
          : "Not started yet";
      case "tajweed":
        return levelProgress.currentTopic
          ? `${levelProgress.currentTopic.nameEn}`
          : "Not started yet";
      case "hifz":
        return levelProgress.lastPosition.lastStudiedSurah
          ? `${levelProgress.lastPosition.lastStudiedSurah} · Ayah ${levelProgress.lastPosition.lastStudiedAyah || 0}`
          : "Not started yet";
      default:
        return "Not started yet";
    }
  })();

  return (
    <div
      className="glass-card overflow-hidden animate-fade-in-up"
      style={{ animationDelay: "0.15s" }}
    >
      <div className="gradient-accent-bar" />
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${config.accentColor}`} />
              <h3 className="text-lg font-bold text-foreground">
                {config.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <Badge className="bg-nejah-electric/10 text-nejah-electric border border-nejah-electric/20 font-semibold">
            {rank}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="relative h-2.5 bg-muted dark:bg-nejah-surface rounded-full mb-1 overflow-hidden">
          <div
            className={`${PROGRESS_BAR_COLORS[track] || "progress-gradient"} h-full rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-right text-xs font-bold text-muted-foreground mb-4">
          {percentage}%
        </p>

        {/* Track-specific stats */}
        {track === "qaidah" && (
          <QaidaCard levelProgress={levelProgress} />
        )}
        {track === "quran_reading" && (
          <QuranReadingCard levelProgress={levelProgress} />
        )}
        {track === "tajweed" && (
          <TajweedCard levelProgress={levelProgress} />
        )}
        {track === "hifz" && (
          <HifzCard
            levelProgress={levelProgress}
            legacyProgress={legacyProgress}
          />
        )}

        <Button
          variant="outline"
          className="w-full rounded-xl border-border/60 hover:border-nejah-electric/30 hover:bg-primary/5 transition-all"
          onClick={onViewProgress}
        >
          View Full Progress <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
