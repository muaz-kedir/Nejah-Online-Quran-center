import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BookOpen, Award, TrendingUp, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';

const API = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

function StudentProgress() {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${API}/student/dashboard/progress`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProgress(data);
        }
      } catch (err) {
        console.error('Failed to fetch progress', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700" />
      </div>
    );
  }

  const percentage = progress?.percentage ?? 0;
  const surahsCompleted = progress?.surahs ?? 0;
  const totalSurahs = 114;
  const rank = progress?.rank ?? 'Beginner';
  const lastStudied = progress?.lastStudiedSurah ?? 'N/A';

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1.5">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-emerald-950 font-serif">Quran Progress</h1>
        </div>

        <div className="space-y-8">
          {/* Main Progress Card */}
          <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm border-b-4 border-b-gray-100/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold text-emerald-950 font-serif">Hifz Completion</h3>
                <p className="text-sm text-gray-400 font-medium">{percentage}% of the Quran memorized</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-full flex items-center gap-2">
                <Award className="h-4 w-4" /> Rank: {rank}
              </Badge>
            </div>

            <div className="mb-10">
              <ProgressBar value={percentage} className="h-4 bg-emerald-100 [&>div]:bg-emerald-800 rounded-full" />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-gray-400">0%</span>
                <span className="text-[10px] font-bold text-gray-400">100%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-emerald-50/50 p-6 rounded-3xl text-center border border-emerald-100/50">
                <p className="text-4xl font-extrabold text-emerald-950 font-serif">{surahsCompleted}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Surahs / {totalSurahs}
                </p>
              </div>
              <div className="bg-amber-50/50 p-6 rounded-3xl text-center border border-amber-100/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <p className="text-sm font-extrabold text-amber-800 uppercase tracking-wider">Rank</p>
                </div>
                <p className="text-xl font-extrabold text-amber-950 font-serif mt-2">{rank}</p>
              </div>
              <div className="bg-blue-50/50 p-6 rounded-3xl text-center border border-blue-100/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-extrabold text-blue-800 uppercase tracking-wider">Last Studied</p>
                </div>
                <p className="text-lg font-extrabold text-blue-950 font-serif mt-2">{lastStudied}</p>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="h-6 w-6 text-emerald-700" />
              <h3 className="text-xl font-bold text-emerald-950 font-serif">Memorization Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ayahs Memorized</p>
                <p className="text-3xl font-extrabold text-emerald-950 font-serif">{progress?.ayahs ?? 0}</p>
              </div>
              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weeks Active</p>
                <p className="text-3xl font-extrabold text-emerald-950 font-serif">{progress?.weeksActive ?? 0}</p>
              </div>
              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Juz Completed</p>
                <p className="text-3xl font-extrabold text-emerald-950 font-serif">{progress?.juzCompleted ?? 0}</p>
              </div>
              <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Juz</p>
                <p className="text-3xl font-extrabold text-emerald-950 font-serif">{progress?.currentJuz ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/student_/progress')({
  component: StudentProgress,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token) {
        window.location.href = '/login';
        throw new Error('Not authenticated');
      }
      if (role !== 'student') {
        window.location.href = '/dashboard';
        throw new Error('Access denied: Student role required');
      }
    }
  },
});
