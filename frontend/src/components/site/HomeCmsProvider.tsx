import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  fetchPublicMissionContent,
  fetchPublicProgramsContent,
  fetchPublicTestimonials,
  type HomeMissionCard,
  type HomeMissionSection,
  type HomeProgram,
  type HomeProgramsSection,
  type Testimonial,
} from '@/lib/home-cms';

type HomeCmsState = {
  missionSection: HomeMissionSection | null;
  missionCards: HomeMissionCard[];
  programsSection: HomeProgramsSection | null;
  programs: HomeProgram[];
  testimonials: Testimonial[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const HomeCmsCtx = createContext<HomeCmsState | null>(null);

export function HomeCmsProvider({ children }: { children: ReactNode }) {
  const [missionSection, setMissionSection] = useState<HomeMissionSection | null>(null);
  const [missionCards, setMissionCards] = useState<HomeMissionCard[]>([]);
  const [programsSection, setProgramsSection] = useState<HomeProgramsSection | null>(null);
  const [programs, setPrograms] = useState<HomeProgram[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mission, programsData, testimonialsData] = await Promise.all([
        fetchPublicMissionContent(),
        fetchPublicProgramsContent(),
        fetchPublicTestimonials(),
      ]);
      setMissionSection(mission.section);
      setMissionCards(mission.cards);
      setProgramsSection(programsData.section);
      setPrograms(programsData.programs);
      setTestimonials(testimonialsData);
    } catch (e: any) {
      setError(e.message || 'Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <HomeCmsCtx.Provider
      value={{
        missionSection,
        missionCards,
        programsSection,
        programs,
        testimonials,
        loading,
        error,
        refresh: load,
      }}
    >
      {children}
    </HomeCmsCtx.Provider>
  );
}

export function useHomeCms() {
  const ctx = useContext(HomeCmsCtx);
  if (!ctx) throw new Error('useHomeCms must be used within HomeCmsProvider');
  return ctx;
}
