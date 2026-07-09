import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useHomeCms } from "./HomeCmsProvider";
import { pickLocalized, resolveCmsImageUrl, type CmsLang } from "@/lib/home-cms";

const testimonialsLabels = {
  en: {
    program: "Program",
    duration: "Duration",
    since: "Student Since",
    studentType: "Student Type",
    child: "Child",
    adult: "Adult",
    parent: "Parent",
    all: "All",
    filterTitle: "Filters",
    featuredOnly: "Featured Only",
    allPrograms: "All Programs",
    allCountries: "All Countries",
    noReviews: "No testimonials match your selected filters.",
    loading: "Loading testimonials...",
  },
  ar: {
    program: "البرنامج",
    duration: "المدة",
    since: "طالب منذ",
    studentType: "نوع الطالب",
    child: "طفل",
    adult: "بالغ",
    parent: "ولي أمر",
    all: "الكل",
    filterTitle: "الفلاتر",
    featuredOnly: "المميزة فقط",
    allPrograms: "كل البرامج",
    allCountries: "كل البلدان",
    noReviews: "لا توجد آراء تطابق الفلاتر المحددة.",
    loading: "جاري تحميل الآراء...",
  },
  am: {
    program: "ፕሮግራም",
    duration: "ቆይታ",
    since: "ተማሪ ከ",
    studentType: "የተማሪ ዓይነት",
    child: "ልጅ",
    adult: "አዋቂ",
    parent: "ወላጅ",
    all: "ሁሉም",
    filterTitle: "ማጣሪያዎች",
    featuredOnly: "የተመረጡት ብቻ",
    allPrograms: "ሁሉም ፕሮግራሞች",
    allCountries: "ሁሉም ሀገራት",
    noReviews: "ከተመረጡት ማጣሪያዎች ጋር የሚዛመድ ምስክርነት አልተገኘም።",
    loading: "ምስክርነቶችን በመጫን ላይ...",
  },
};

export function Testimonials() {
  const { lang } = useTheme(); // 'en' | 'ar' | 'am'
  const { testimonials, loading } = useHomeCms();

  const [i, setI] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const labels = testimonialsLabels[lang as CmsLang] || testimonialsLabels.en;

  // Derive unique countries and programs from testimonials
  const uniqueCountries = Array.from(
    new Set(testimonials.map((t) => t.country).filter(Boolean)),
  ).sort();

  const uniquePrograms = Array.from(
    new Set(testimonials.map((t) => t.program).filter(Boolean)),
  ).sort();

  // Filter logic
  const filtered = testimonials.filter((t) => {
    if (featuredOnly && !t.isFeatured) return false;
    if (selectedType !== "all" && t.studentType !== selectedType) return false;
    if (selectedProgram !== "all" && t.program !== selectedProgram) return false;
    if (selectedCountry !== "all" && t.country !== selectedCountry) return false;
    return true;
  });

  // Carousel sliding handlers
  const handleNext = useCallback(() => {
    if (filtered.length === 0) return;
    setI((prev) => (prev + 1) % filtered.length);
  }, [filtered.length]);

  const handlePrev = () => {
    if (filtered.length === 0) return;
    setI((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  // Auto slide every 6 seconds, paused if only 1 review
  useEffect(() => {
    if (filtered.length <= 1) return;
    const tm = setInterval(handleNext, 6000);
    return () => clearInterval(tm);
  }, [filtered.length, handleNext]);

  // Touch handlers for mobile swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (diff > minSwipeDistance) {
      handleNext();
    } else if (diff < -minSwipeDistance) {
      handlePrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const getInitials = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : "T";
  };

  if (loading) {
    return (
      <section id="testimonials" className="py-20 md:py-28">
        <div className="container-x max-w-3xl text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p>{labels.loading}</p>
        </div>
      </section>
    );
  }

  // If no testimonials exist in database, hide section
  if (testimonials.length === 0) {
    return null;
  }

  const review = filtered[i];

  return (
    <section id="testimonials" className="py-20 md:py-28">
      {/* Filtering UI */}
      <div className="container-x max-w-3xl mx-auto mb-8 px-4">
        <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-4 rounded-3xl border border-border/60 text-xs">
          {/* Program filter */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {labels.program}
            </span>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setI(0);
              }}
              className="bg-background dark:bg-nejah-surface border border-border dark:border-nejah-border-blue rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="all">{labels.allPrograms}</option>
              {uniquePrograms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Country filter */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {labels.country}
            </span>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setI(0);
              }}
              className="bg-background dark:bg-nejah-surface border border-border dark:border-nejah-border-blue rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="all">{labels.allCountries}</option>
              {uniqueCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Student Type filter */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {labels.studentType}
            </span>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setI(0);
              }}
              className="bg-background dark:bg-nejah-surface border border-border dark:border-nejah-border-blue rounded-xl px-3 py-2 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="all">{labels.all}</option>
              <option value="child">{labels.child}</option>
              <option value="adult">{labels.adult}</option>
              <option value="parent">{labels.parent}</option>
            </select>
          </div>

          {/* Featured toggle */}
          <button
            onClick={() => {
              setFeaturedOnly(!featuredOnly);
              setI(0);
            }}
            className={`flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              featuredOnly
                ? "bg-primary text-white border-primary"
                : "bg-background dark:bg-nejah-surface border-border dark:border-nejah-border-blue text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${featuredOnly ? "fill-current" : ""}`} />
            <span>{labels.featuredOnly}</span>
          </button>
        </div>
      </div>

      <div className="container-x max-w-3xl">
        <div
          className="glass-panel relative overflow-hidden rounded-3xl p-8 md:p-12"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Quote className="absolute top-6 end-6 size-16 text-primary/10" />

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-medium">
              {labels.noReviews}
            </div>
          ) : (
            <>
              {/* Rating stars */}
              <div className="flex gap-1 mb-6 text-yellow-500">
                {Array.from({ length: review.rating || 5 }).map((_, idx) => (
                  <Star key={idx} className="size-5 fill-current" />
                ))}
              </div>

              <div className="relative min-h-[180px] md:min-h-[140px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <p className="text-lg md:text-xl font-medium leading-relaxed mb-6">
                      "{pickLocalized(review.testimonialText, lang as CmsLang)}"
                    </p>

                    {/* Avatar & Info */}
                    <div className="flex items-center gap-3">
                      {review.photo ? (
                        <img
                          src={
                            review.photo.startsWith("http")
                              ? review.photo
                              : resolveCmsImageUrl(review.photo)
                          }
                          alt=""
                          className="size-11 rounded-full object-cover border border-border"
                          onError={(e) => {
                            // Hide image if load fails
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="size-11 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-lg">
                          {getInitials(review.displayName || review.studentName)}
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-foreground">
                          {review.displayName || review.studentName}
                          {review.parentName && (
                            <span className="text-xs text-muted-foreground font-normal ml-1">
                              (Parent: {review.parentName})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <span>{review.country}</span>
                          {review.program && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className="text-primary font-semibold">{review.program}</span>
                            </>
                          )}
                          {review.learningDuration && (
                            <>
                              <span className="opacity-40">•</span>
                              <span>{review.learningDuration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slider Navigation & Dots */}
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-border/40">
                <div className="flex gap-2">
                  {filtered.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setI(idx)}
                      aria-label={`Show review ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === i ? "w-8 bg-primary" : "w-1.5 bg-border"
                      }`}
                    />
                  ))}
                </div>
                {filtered.length > 1 && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={handlePrev}
                      className="h-8 w-8 rounded-full border border-border hover:bg-muted/50 flex items-center justify-center transition-colors cursor-pointer text-foreground"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="h-8 w-8 rounded-full border border-border hover:bg-muted/50 flex items-center justify-center transition-colors cursor-pointer text-foreground"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// Add a placeholder component import alias mapping if needed
export const Loader2 = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
