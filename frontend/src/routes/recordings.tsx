import { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Video,
  Search,
  ExternalLink,
  Download,
  Clock,
  HardDrive,
  RefreshCw,
  Film,
  Mic,
  Monitor,
} from 'lucide-react';

export const Route = createFileRoute('/recordings')({
  component: RecordingsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'qirat_manager', 'teacher']),
});

function RecordingsPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || '');
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const endpoint = localStorage.getItem('userRole') === 'teacher'
        ? '/recordings/teacher'
        : '/recordings/all';
      const data = await api(endpoint);
      setRecordings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type?: string) => {
    if (!type) return <Video className="h-4 w-4" />;
    if (type.includes('audio')) return <Mic className="h-4 w-4" />;
    if (type.includes('screen')) return <Monitor className="h-4 w-4" />;
    return <Film className="h-4 w-4" />;
  };

  const getTypeLabel = (type?: string) => {
    if (!type) return 'Recording';
    if (type.includes('audio')) return 'Audio Only';
    if (type.includes('screen')) return 'Screen Share';
    if (type.includes('gallery')) return 'Gallery View';
    if (type.includes('shared_screen')) return 'Screen + Audio';
    if (type.includes('audio_only')) return 'Audio Only';
    if (type.includes('video')) return 'Video';
    return type;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const flattenRecordings = (items: any[]): any[] => {
    const flat: any[] = [];
    for (const item of items) {
      if (item.recording_files) {
        for (const file of item.recording_files) {
          flat.push({ ...file, meetingTopic: item.topic, meetingId: item.id, hostEmail: item.host_email, startTime: item.start_time });
        }
      } else {
        flat.push(item);
      }
    }
    return flat;
  };

  const allRecordings = useMemo(() => flattenRecordings(recordings), [recordings]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allRecordings.filter(r =>
      (r.meetingTopic || '').toLowerCase().includes(q) ||
      (r.hostEmail || '').toLowerCase().includes(q) ||
      (r.recording_type || '').toLowerCase().includes(q)
    );
  }, [allRecordings, search]);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-nejah-slate-blue mb-1">
              Media
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-foreground">Recordings</h1>
            <p className="text-sm leading-relaxed text-nejah-slate-blue mt-1">
              View and manage cloud recordings from Zoom sessions.
            </p>
          </div>
          <Button onClick={fetchRecordings} variant="outline" className="gap-2 rounded-xl h-11" disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recordings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-background/50 border-none rounded-xl text-xs"
            />
          </div>
          <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-3 py-1.5">
            {filtered.length} recording{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="h-40 bg-card dark:bg-nejah-surface rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel bg-card dark:bg-nejah-surface rounded-[2.5rem] p-12 text-center border border-border dark:border-white/5">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-nejah-slate-blue font-medium italic">No recordings found</p>
            <p className="text-xs text-nejah-slate-blue mt-1">Recordings appear here after Zoom cloud recording processing completes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r: any, i: number) => (
              <Card key={r.id || i} className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {getTypeIcon(r.recording_type)}
                  </div>
                  <Badge className="text-[8px] font-black uppercase tracking-widest bg-background/50 text-nejah-slate-blue border-none">
                    {getTypeLabel(r.recording_type)}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-2">
                  {r.meetingTopic || 'Untitled Meeting'}
                </h3>
                {r.hostEmail && (
                  <p className="text-[10px] font-bold text-nejah-slate-blue mb-1 truncate">{r.hostEmail}</p>
                )}
                <div className="flex flex-wrap gap-3 text-[10px] text-nejah-slate-blue font-bold mt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {r.duration ? `${r.duration}s` : (r.recordingDuration ? `${r.recordingDuration}s` : 'N/A')}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(r.fileSize || r.file_size)}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  {r.play_url && (
                    <a href={r.play_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-nejah-sapphire text-white rounded-xl h-9 text-xs font-bold hover:bg-nejah-azure transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" /> Play
                    </a>
                  )}
                  {r.download_url && (
                    <a href={r.download_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl bg-background/50 border border-border dark:border-white/5 text-xs font-bold hover:bg-muted transition-colors">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
