import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, X, Calendar, Award, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Define criteria types and lists
const RATING_OPTIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Needs Improvement'];

const QAIDAH_CRITERIA = [
  'Letter Recognition',
  'Pronunciation Accuracy',
  'Reading Fluency',
  'Harakat Understanding',
  'Lesson Completion',
  'Homework Completion',
  'Participation',
];

const QURAN_CRITERIA = [
  'Reading Accuracy',
  'Fluency',
  'Pronunciation',
  'Makharij Accuracy',
  'Confidence',
  'Homework Completion',
];

const TAJWEED_CRITERIA = [
  'Rule Understanding',
  'Rule Application',
  'Reading Accuracy',
  'Practical Performance',
  'Homework Completion',
];

const HIFZ_CRITERIA = [
  'Memorization Accuracy',
  'Fluency',
  'Revision Quality',
  'Retention Strength',
  'Tajweed Application',
  'Confidence During Recitation',
];

interface Props {
  studentId: string;
  studentLevel: string;
}

export function TeacherStudentEvaluationsPanel({ studentId, studentLevel }: Props) {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [evaluationType, setEvaluationType] = useState('Weekly Evaluation');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [score, setScore] = useState(80);
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [ratings, setRatings] = useState<Record<string, string>>({});
  
  // Metadata states based on level
  const [qaidahTopic, setQaidahTopic] = useState('Arabic Alphabet Recognition');
  const [quranSurah, setQuranSurah] = useState('');
  const [quranAyah, setQuranAyah] = useState('');
  const [quranReadingLevel, setQuranReadingLevel] = useState('Intermediate');
  const [quranMistakeCount, setQuranMistakeCount] = useState(0);
  const [tajweedTopic, setTajweedTopic] = useState('Noon Sakinah');
  const [hifzSurah, setHifzSurah] = useState('');
  const [hifzAyahs, setHifzAyahs] = useState('');
  const [hifzRevisionPerformance, setHifzRevisionPerformance] = useState('Good');

  // Load evaluations
  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const data = await api(`/evaluations?studentId=${studentId}`);
      setEvaluations(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, [studentId]);

  // Set default ratings based on current studentLevel when opening form
  const initRatings = () => {
    const defaultRatings: Record<string, string> = {};
    let criteria: string[] = [];

    if (studentLevel === 'Qaida Nooraniya') criteria = QAIDAH_CRITERIA;
    else if (studentLevel === 'Quran Reading') criteria = QURAN_CRITERIA;
    else if (studentLevel === 'Tajweed Program') criteria = TAJWEED_CRITERIA;
    else criteria = HIFZ_CRITERIA;

    criteria.forEach((c) => {
      defaultRatings[c] = 'Good';
    });
    setRatings(defaultRatings);
  };

  const handleOpenForm = () => {
    initRatings();
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setComments('');
    setRecommendations('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      toast.error('Comments are required');
      return;
    }

    setSubmitting(true);
    try {
      // Build metadata based on level
      let metadata: any = {};
      if (studentLevel === 'Qaida Nooraniya') {
        metadata = { topic: qaidahTopic };
      } else if (studentLevel === 'Quran Reading') {
        metadata = {
          surah: quranSurah,
          ayah: quranAyah,
          readingLevel: quranReadingLevel,
          mistakeCount: Number(quranMistakeCount),
        };
      } else if (studentLevel === 'Tajweed Program') {
        metadata = { topic: tajweedTopic };
      } else {
        metadata = {
          surah: hifzSurah,
          ayahs: hifzAyahs,
          revisionPerformance: hifzRevisionPerformance,
        };
      }

      await api('/evaluations', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          evaluationType,
          evaluationDate,
          score: Number(score),
          teacherComments: comments,
          recommendations,
          criteriaRatings: ratings,
          metadata,
        }),
      });

      toast.success('Evaluation submitted successfully');
      setShowForm(false);
      setComments('');
      setRecommendations('');
      loadEvaluations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold font-serif text-nejah-sapphire dark:text-foreground">Exam Evaluations</h3>
        {!showForm && (
          <Button onClick={handleOpenForm} className="bg-nejah-surface text-white hover:bg-nejah-sapphire">
            <Plus className="mr-2 h-4 w-4" /> Conduct Evaluation
          </Button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="bg-card p-6 md:p-8 rounded-3xl border border-border space-y-6">
          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <h4 className="text-lg font-bold text-nejah-sapphire text-foreground font-serif">New Evaluation</h4>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Level:</span>
                <Badge variant="outline">{studentLevel}</Badge>
              </div>
            </div>
            <Button type="button" variant="ghost" onClick={handleCloseForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Evaluation Type</Label>
              <Select value={evaluationType} onValueChange={setEvaluationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly Evaluation">Weekly Evaluation</SelectItem>
                  <SelectItem value="Monthly Evaluation">Monthly Evaluation</SelectItem>
                  <SelectItem value="Level Completion Evaluation">Level Completion Evaluation</SelectItem>
                  <SelectItem value="Promotion Evaluation">Promotion Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Score (0-100)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-24"
                />
                <div className="text-xs">
                  Recommendation: {' '}
                  <Badge className={score >= 80 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}>
                    {score >= 80 ? 'Ready For Promotion' : 'Continue Current Level'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Level Specific Topic/Metadata Inputs */}
          <div className="bg-muted/30 p-5 rounded-2xl border border-dashed space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Level Curriculum Context</h5>
            
            {studentLevel === 'Qaida Nooraniya' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Topic/Lesson</Label>
                  <Select value={qaidahTopic} onValueChange={setQaidahTopic}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arabic Alphabet Recognition">Arabic Alphabet Recognition</SelectItem>
                      <SelectItem value="Single Letters">Single Letters</SelectItem>
                      <SelectItem value="Compound Letters">Compound Letters</SelectItem>
                      <SelectItem value="Harakat">Harakat</SelectItem>
                      <SelectItem value="Tanween">Tanween</SelectItem>
                      <SelectItem value="Madd">Madd</SelectItem>
                      <SelectItem value="Sukoon">Sukoon</SelectItem>
                      <SelectItem value="Shaddah">Shaddah</SelectItem>
                      <SelectItem value="Reading Practice">Reading Practice</SelectItem>
                      <SelectItem value="Advanced Reading Practice">Advanced Reading Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {studentLevel === 'Quran Reading' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Current Surah</Label>
                  <Input
                    placeholder="e.g. Al-Baqarah"
                    value={quranSurah}
                    onChange={(e) => setQuranSurah(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ayah Range</Label>
                  <Input
                    placeholder="e.g. 1-10"
                    value={quranAyah}
                    onChange={(e) => setQuranAyah(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reading Level</Label>
                  <Select value={quranReadingLevel} onValueChange={setQuranReadingLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mistake Count</Label>
                  <Input
                    type="number"
                    min="0"
                    value={quranMistakeCount}
                    onChange={(e) => setQuranMistakeCount(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {studentLevel === 'Tajweed Program' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tajweed Topic studied</Label>
                  <Select value={tajweedTopic} onValueChange={setTajweedTopic}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Noon Sakinah">Noon Sakinah</SelectItem>
                      <SelectItem value="Meem Sakinah">Meem Sakinah</SelectItem>
                      <SelectItem value="Ghunnah">Ghunnah</SelectItem>
                      <SelectItem value="Madd Rules">Madd Rules</SelectItem>
                      <SelectItem value="Qalqalah">Qalqalah</SelectItem>
                      <SelectItem value="Waqf Rules">Waqf Rules</SelectItem>
                      <SelectItem value="Makharij">Makharij</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(studentLevel === 'Hifz Program' || studentLevel === "Hifz Muraja'a") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Memorized Surah</Label>
                  <Input
                    placeholder="e.g. An-Naba"
                    value={hifzSurah}
                    onChange={(e) => setHifzSurah(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Memorized Ayahs</Label>
                  <Input
                    placeholder="e.g. 1-40"
                    value={hifzAyahs}
                    onChange={(e) => setHifzAyahs(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revision Performance</Label>
                  <Select value={hifzRevisionPerformance} onValueChange={setHifzRevisionPerformance}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Criteria Ratings */}
          <div className="space-y-4">
            <h5 className="text-sm font-bold text-nejah-sapphire text-foreground font-serif border-b pb-2">Criteria Ratings</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(ratings).map((crit) => (
                <div key={crit} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/20 rounded-xl border">
                  <span className="text-xs font-bold text-foreground">{crit}</span>
                  <Select
                    value={ratings[crit]}
                    onValueChange={(val) => setRatings((prev) => ({ ...prev, [crit]: val }))}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-sm font-bold text-nejah-sapphire text-foreground font-serif border-b pb-2">Feedback &amp; Remarks</h5>
            <div className="space-y-2">
              <Label>Teacher Comments <span className="text-red-500">*</span></Label>
              <Textarea
                required
                rows={3}
                placeholder="Required. Provide specific notes on strengths and areas for improvement..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Recommendations (Optional)</Label>
              <Textarea
                rows={2}
                placeholder="Optional. Add resource links, study tips, or homework guidance..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-nejah-surface text-white hover:bg-nejah-sapphire">
              {submitting ? 'Submitting...' : 'Submit Evaluation'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading evaluations...</div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 border border-dashed rounded-3xl">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="font-bold text-nejah-sapphire text-foreground">No evaluations recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Conduct the first evaluation to track this student's progress.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {evaluations.map((ev) => (
                <div key={ev.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md">
                        {ev.evaluationType}
                      </span>
                      <Badge variant="outline">{ev.programType}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                        <Calendar className="h-3 w-3" /> {new Date(ev.evaluationDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-foreground">
                      <p className="font-bold">Comments:</p>
                      <p className="text-muted-foreground italic">&quot;{ev.teacherComments}&quot;</p>
                    </div>

                    {ev.recommendations && (
                      <div className="text-xs text-foreground bg-muted/50 p-3 rounded-xl">
                        <p className="font-bold">Recommendations:</p>
                        <p className="text-muted-foreground">{ev.recommendations}</p>
                      </div>
                    )}

                    {/* Criteria ratings display */}
                    {ev.criteriaRatings && Object.keys(ev.criteriaRatings).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {Object.entries(ev.criteriaRatings).map(([crit, rating]) => (
                          <div key={crit} className="text-[10px] bg-muted px-2 py-1 rounded-md border flex items-center gap-1">
                            <span className="font-bold">{crit}:</span>
                            <span className="text-primary font-bold">{String(rating)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col md:items-end justify-between items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-center md:text-right">
                      <p className="text-xs text-muted-foreground font-bold">Score</p>
                      <p className="text-3xl font-black text-nejah-sapphire text-foreground font-serif">{ev.score}/100</p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={ev.promotionRecommendation === 'Ready For Promotion' ? 'bg-emerald-600 border-none' : 'bg-slate-400 border-none'}>
                        {ev.promotionRecommendation}
                      </Badge>
                      
                      {ev.promotionRecommendation === 'Ready For Promotion' && (
                        <div className="flex flex-col items-end text-[10px]">
                          <span className="text-muted-foreground font-bold">Promotion Status:</span>
                          <Badge className={
                            ev.promotionStatus === 'Approved' ? 'bg-emerald-600 border-none text-white' :
                            ev.promotionStatus === 'Rejected' ? 'bg-red-600 border-none text-white' :
                            'bg-amber-500 border-none text-white'
                          }>
                            {ev.promotionStatus}
                          </Badge>
                          {ev.approvalNotes && (
                            <span className="text-muted-foreground text-[9px] max-w-44 truncate" title={ev.approvalNotes}>
                              &quot;{ev.approvalNotes}&quot;
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
