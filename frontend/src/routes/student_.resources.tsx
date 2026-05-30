import { createFileRoute } from '@tanstack/react-router';
import { FolderOpen } from 'lucide-react';

function StudentResources() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1.5">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-emerald-950 font-serif">Resources</h1>
        </div>

        <div className="bg-gray-50/50 rounded-[32px] p-20 text-center border border-gray-100">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <FolderOpen className="h-10 w-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-950 font-serif mb-3">Coming Soon</h3>
          <p className="text-sm text-gray-400 font-medium max-w-md mx-auto">
            Educational resources, worksheets, and study materials will be available here shortly.
          </p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/student_/resources')({
  component: StudentResources,
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
