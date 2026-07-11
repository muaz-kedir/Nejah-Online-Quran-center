import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { X, ArrowRight } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { useTheme } from './ThemeProvider';

export function AnnouncementBanner() {
  const { dir, lang, t } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [announcementText, setAnnouncementText] = useState<{ en: string; ar: string; am: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dismissedSession = sessionStorage.getItem('announcement-dismissed');
    if (dismissedSession) {
      setDismissed(true);
      setLoaded(true);
      return;
    }

    fetch(apiUrl('/teacher-applications/settings?_=' + Date.now()))
      .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
      .then(data => {
        setIsOpen(data.isApplicationsOpen);
        setAnnouncementText(data.announcementText || null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (isOpen && !dismissed && ref.current) {
      const h = ref.current.offsetHeight;
      document.documentElement.style.setProperty('--banner-h', `${h}px`);
    } else {
      document.documentElement.style.removeProperty('--banner-h');
    }
    return () => { document.documentElement.style.removeProperty('--banner-h'); };
  }, [isOpen, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('announcement-dismissed', 'true');
    document.documentElement.style.removeProperty('--banner-h');
  };

  if (!loaded) return null;

  const text =
    announcementText?.[lang as keyof typeof announcementText] ||
    announcementText?.en ||
    (announcementText && (Object.values(announcementText) as string[]).find(v => v)) ||
    t.announcement?.text ||
    '';

  return (
    <AnimatePresence>
      {isOpen && !dismissed && (
        <motion.div
          key="announcement"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed top-0 inset-x-0 z-[60] overflow-hidden"
          ref={ref}
        >
          <div className="relative announcement-gradient">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 scan-line-fast opacity-30" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-white/30 blur-[2px] floating-dot" />
              <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-white/20 blur-[1px] floating-dot" style={{ animationDelay: '2s' }} />
            </div>

            <div
              className="container-x relative z-10 flex items-center justify-between py-2.5 gap-4"
              dir={dir}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shadow-[0_0_12px_rgba(255,255,255,0.15)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                  {t.announcement?.badge || 'Now Hiring'}
                </span>
                <span className="text-white/90 text-sm font-medium truncate">
                  {text}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/apply-as-teacher"
                  className="announcement-cta"
                >
                  <span>{t.announcement?.cta || 'Apply Now'}</span>
                  {dir === 'rtl' ? (
                    <ArrowRight className="size-3.5 rotate-180" />
                  ) : (
                    <ArrowRight className="size-3.5" />
                  )}
                </Link>
                <button
                  onClick={handleDismiss}
                  className="text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  aria-label="Dismiss"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
