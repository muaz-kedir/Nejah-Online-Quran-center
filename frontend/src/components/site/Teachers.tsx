import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./SectionHeader";
import { useTheme } from "./ThemeProvider";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiUrl, resolveCmsImageUrl } from "@/lib/home-cms";

interface TeacherData {
  id: string;
  imageUrl: string | null;
  fullName: string;
  specialization: string;
  experience: string | null;
}

export function Teachers() {
  const { t } = useTheme();
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch(apiUrl("/website/home/teachers"));
        if (!res.ok) throw new Error("Failed to fetch teachers");
        const data = await res.json();
        setTeachers(data || []);
      } catch {
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  if (loading) {
    return (
      <section id="teachers" className="py-20 md:py-28">
        <div className="container-x">
          <SectionHeader title={t.teachers?.title || "Meet Our Expert Scholars"} />
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (!teachers.length) return null;

  return (
    <>
    <section id="teachers" className="py-20 md:py-28">
      <div className="container-x">
        <SectionHeader title={t.teachers?.title || "Meet Our Expert Scholars"} />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {teachers.map((tc, i) => (
            <motion.div
              key={tc.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-panel rounded-3xl p-7 text-center transition-all hover:border-nejah-electric/30"
            >
              <div className="relative mx-auto mb-5 w-fit">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                <img
                  src={tc.imageUrl ? resolveCmsImageUrl(tc.imageUrl) : "/placeholder-teacher.svg"}
                  alt={tc.fullName}
                  loading="lazy"
                  className="relative size-24 rounded-full object-cover ring-4 ring-background"
                />
              </div>
              <h3 className="text-lg font-medium text-foreground">{tc.fullName}</h3>
              <div className="mb-3 text-sm font-semibold text-nejah-electric">{tc.specialization}</div>
              {tc.experience && (
                <p className="mb-5 text-sm leading-relaxed text-nejah-slate-blue">{tc.experience}</p>
              )}
              <Button
                onClick={() => setSelectedTeacher(tc)}
                className="h-11 w-full rounded-full font-semibold shadow-[0_0_16px_rgba(0,102,204,0.35)]"
              >
                {t.teachers?.bookTrial || "Book Trial"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <Dialog open={!!selectedTeacher} onOpenChange={(open) => { if (!open) setSelectedTeacher(null); }}>
      <DialogContent className="max-w-lg">
        {selectedTeacher && (
          <div className="text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-6">
              <div className="relative mx-auto sm:mx-0 w-fit shrink-0">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                <img
                  src={selectedTeacher.imageUrl ? resolveCmsImageUrl(selectedTeacher.imageUrl) : "/placeholder-teacher.svg"}
                  alt={selectedTeacher.fullName}
                  className="relative size-28 rounded-full object-cover ring-4 ring-background"
                />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold">{selectedTeacher.fullName}</DialogTitle>
                <p className="text-sm font-semibold text-nejah-electric mt-1">{selectedTeacher.specialization}</p>
              </div>
            </div>
            {selectedTeacher.experience && (
              <p className="text-sm leading-relaxed text-nejah-slate-blue mb-6">
                {selectedTeacher.experience}
              </p>
            )}
            <p className="text-sm leading-relaxed text-nejah-slate-blue">
              {t.teachers?.bookTrial || "Book Trial"} with {selectedTeacher.fullName} to experience their teaching style firsthand and discuss your learning goals.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
