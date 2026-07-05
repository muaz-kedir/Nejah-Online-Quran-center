import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./SectionHeader";
import t1 from "@/assets/teacher-1.jpg";
import t2 from "@/assets/teacher-2.jpg";
import t3 from "@/assets/teacher-3.jpg";
import { useTheme } from "./ThemeProvider";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface TeacherData {
  img: string;
  name: string;
  spec: string;
  exp: string;
}

export function Teachers() {
  const { t } = useTheme();
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);
  const teachers = [
    { img: t1, name: t.teachers.t1Name, spec: t.teachers.t1Spec, exp: t.teachers.t1Exp },
    { img: t2, name: t.teachers.t2Name, spec: t.teachers.t2Spec, exp: t.teachers.t2Exp },
    { img: t3, name: t.teachers.t3Name, spec: t.teachers.t3Spec, exp: t.teachers.t3Exp },
  ];
  return (
    <>
    <section id="teachers" className="py-20 md:py-28">
      <div className="container-x">
        <SectionHeader title={t.teachers.title} />
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {teachers.map((tc, i) => (
            <motion.div
              key={tc.name}
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
                  src={tc.img}
                  alt={tc.name}
                  loading="lazy"
                  className="relative size-24 rounded-full object-cover ring-4 ring-background"
                />
              </div>
              <h3 className="text-lg font-medium text-foreground">{tc.name}</h3>
              <div className="mb-3 text-sm font-semibold text-nejah-electric">{tc.spec}</div>
              <p className="mb-5 text-sm leading-relaxed text-nejah-slate-blue">{tc.exp}</p>
              <Button
                onClick={() => setSelectedTeacher(tc)}
                className="h-11 w-full rounded-full font-semibold shadow-[0_0_16px_rgba(0,102,204,0.35)]"
              >
                {t.teachers.bookTrial}
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
                  src={selectedTeacher.img}
                  alt={selectedTeacher.name}
                  className="relative size-28 rounded-full object-cover ring-4 ring-background"
                />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold">{selectedTeacher.name}</DialogTitle>
                <p className="text-sm font-semibold text-nejah-electric mt-1">{selectedTeacher.spec}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-nejah-slate-blue mb-6">
              {selectedTeacher.exp}
            </p>
            <p className="text-sm leading-relaxed text-nejah-slate-blue">
              {t.teachers.bookTrial} with {selectedTeacher.name} to experience their teaching style firsthand and discuss your learning goals.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
