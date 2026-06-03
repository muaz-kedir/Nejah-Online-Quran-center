import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { FolderOpen, Download, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, apiUrl, apiHeaders, requireStudentAuth, studentPaths } from '@/lib/student-portal';

const CATEGORIES = [
  'All',
  'Quran Resources',
  'Qaida Nooraniya',
  'Tajweed Materials',
  'Islamic Studies Materials',
  'Class Materials',
];

function StudentResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category !== 'All') params.set('category', category);
        const qs = params.toString();
        const data = await api<any[]>(`/student/dashboard/resources${qs ? `?${qs}` : ''}`);
        setResources(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, category]);

  const fileHref = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return apiUrl(url.startsWith('/') ? url : `/${url}`);
  };

  if (loading) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.resources}>
      <main className="flex-1 px-10 py-10">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-emerald-950 font-serif">Learning Resources</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search resources..."
              className="pl-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={category === c ? 'default' : 'outline'}
                className={category === c ? 'bg-emerald-700' : ''}
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-16 text-center border border-gray-100">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No resources available yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <Badge className="mb-3 bg-emerald-50 text-emerald-800 border-none">{r.category}</Badge>
                <h3 className="font-bold text-lg text-emerald-950">{r.title}</h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-3">{r.description}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" asChild>
                    <a href={fileHref(r.fileUrl)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> View
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-700"
                    onClick={async () => {
                      await fetch(apiUrl(`/resources/${r.id}`), { headers: apiHeaders() });
                      window.open(fileHref(r.fileUrl), '_blank');
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/resources')({
  component: StudentResources,
  beforeLoad: requireStudentAuth,
});
