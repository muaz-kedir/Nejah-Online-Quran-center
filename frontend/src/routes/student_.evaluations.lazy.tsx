/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Award, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export const Route = createLazyFileRoute('/student_/evaluations')({
  component: StudentEvaluations,
});

function StudentEvaluations() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/evaluations')
      .then(setEvaluations)
      .catch((err) => console.error('Failed to load student evaluations', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.evaluations}>
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-4xl space-y-8">
        <div>
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-nejah-sapphire text-foreground font-serif">My Exam Evaluations</h1>
          <p className="text-sm text-muted-foreground mt-2">View details of your level evaluations, grades, and teacher recommendations.</p>
        </div>

        {evaluations.length === 0 ? (
          <Card className="rounded-[32px] border p-8 text-center bg-card">
            <CardContent className="pt-6">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-bold text-nejah-sapphire text-foreground font-serif">No evaluations recorded yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Once your teacher conducts an exam or level evaluation, it will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {evaluations.map((ev) => (
              <Card key={ev.id} className="rounded-[32px] border overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/30 border-b p-6 flex flex-row flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-800 border-none font-bold uppercase tracking-wider text-[9px] px-2 py-0.5">
                        {ev.evaluationType}
                      </Badge>
                      <Badge variant="secondary" className="font-bold text-[10px]">{ev.programType}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground pt-1">
                      <Calendar className="h-3.5 w-3.5" /> Evaluation Date: {new Date(ev.evaluationDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] text-foreground font-bold block uppercase tracking-wider">Overall Grade</span>
                    <span className="text-3xl font-black text-nejah-sapphire text-foreground font-serif">{ev.score}</span>
                    <span className="text-sm font-bold text-muted-foreground">/100</span>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Comments */}
                    <div className="md:col-span-2 space-y-2">
                      <h4 className="text-sm font-extrabold text-nejah-sapphire text-foreground uppercase tracking-wider">Teacher Comments</h4>
                      <p className="text-sm text-foreground italic bg-muted/20 p-4 rounded-2xl border">&quot;{ev.teacherComments}&quot;</p>
                    </div>

                    {/* Recommendation */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-extrabold text-nejah-sapphire text-foreground uppercase tracking-wider">Promotion Readiness</h4>
                      <div className="bg-muted/20 p-4 rounded-2xl border flex flex-col justify-between h-full min-h-24">
                        <div className="text-xs font-bold text-foreground">Recommendation:</div>
                        <Badge className={`w-fit mt-2 font-bold ${ev.promotionRecommendation === 'Ready For Promotion' ? 'bg-emerald-600 border-none text-white' : 'bg-slate-500 border-none text-white'}`}>
                          {ev.promotionRecommendation}
                        </Badge>
                        {ev.promotionRecommendation === 'Ready For Promotion' && (
                          <div className="mt-2 text-[10px] font-bold">
                            Approval Status:{' '}
                            <Badge className={
                              ev.promotionStatus === 'Approved' ? 'bg-emerald-600 border-none' :
                              ev.promotionStatus === 'Rejected' ? 'bg-red-600 border-none' :
                              'bg-amber-500 border-none'
                            }>
                              {ev.promotionStatus}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {ev.recommendations && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-sm font-extrabold text-nejah-sapphire text-foreground uppercase tracking-wider">Recommendations</h4>
                      <p className="text-sm text-muted-foreground">{ev.recommendations}</p>
                    </div>
                  )}

                  {/* Criteria breakdown */}
                  {ev.criteriaRatings && Object.keys(ev.criteriaRatings).length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-extrabold text-nejah-sapphire text-foreground uppercase tracking-wider border-b pb-1.5">Criteria Breakdown</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(ev.criteriaRatings).map(([crit, rating]) => (
                          <div key={crit} className="flex justify-between items-center bg-muted/10 p-3 rounded-xl border text-xs">
                            <span className="font-bold text-muted-foreground">{crit}</span>
                            <Badge variant="outline" className="font-bold text-[10px] text-primary border-primary/20 bg-primary/5">
                              {String(rating)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Level curriculum metadata */}
                  {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                    <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 bg-muted/40 p-3 rounded-xl font-bold">
                      {ev.metadata.topic && <span><strong>Topic/Lesson:</strong> {ev.metadata.topic}</span>}
                      {ev.metadata.surah && <span><strong>Surah:</strong> {ev.metadata.surah}</span>}
                      {ev.metadata.ayah && <span><strong>Ayah Range:</strong> {ev.metadata.ayah}</span>}
                      {ev.metadata.ayahs && <span><strong>Ayah Range:</strong> {ev.metadata.ayahs}</span>}
                      {ev.metadata.readingLevel && <span><strong>Reading Level:</strong> {ev.metadata.readingLevel}</span>}
                      {ev.metadata.mistakeCount !== undefined && <span><strong>Mistakes:</strong> {ev.metadata.mistakeCount}</span>}
                      {ev.metadata.revisionPerformance && <span><strong>Revision Quality:</strong> {ev.metadata.revisionPerformance}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </StudentPortalLayout>
  );
}
