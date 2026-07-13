import { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Search, Download, FileText, Image as ImageIcon,
  PlaySquare, Headphones, FileArchive, ArrowRight, Clock, Star,
  BookOpen, Sparkles, ExternalLink, Filter, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';

function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

function formatSize(bytes: number) {
  if (!bytes) return 'Unknown size';
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`;
}

const TYPE_FILTERS = ['All', 'Video', 'PDF', 'Image', 'Audio'] as const;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <PlaySquare className="w-5 h-5 text-rose-500" />,
  mp4: <PlaySquare className="w-5 h-5 text-rose-500" />,
  pdf: <FileText className="w-5 h-5 text-blue-500" />,
  image: <ImageIcon className="w-5 h-5 text-emerald-500" />,
  mp3: <Headphones className="w-5 h-5 text-amber-500" />,
  audio: <Headphones className="w-5 h-5 text-amber-500" />,
  zip: <FileArchive className="w-5 h-5 text-slate-500" />,
};

function getFileIcon(type: string) {
  const t = type.toLowerCase();
  for (const [key, icon] of Object.entries(TYPE_ICONS)) {
    if (t.includes(key)) return icon;
  }
  return <FileText className="w-5 h-5 text-slate-500" />;
}

function ResourceCard({
  resource,
  onOpen,
  onDownload,
  onDetail,
}: {
  resource: any;
  onOpen: (r: any) => void;
  onDownload: (r: any) => void;
  onDetail: (r: any) => void;
}) {
  const type = (resource.resourceType || '').toLowerCase();
  const isVideo = type.includes('video') || type.includes('mp4') || !!resource.youtubeUrl;
  const isImage = type.includes('img') || type.includes('png') || type.includes('jpg');
  const youtubeId = getYoutubeId(resource.youtubeUrl);

  return (
    <div className="bg-card border rounded-3xl overflow-hidden hover:border-nejah-blue/40 transition-colors group flex flex-col">
      {/* Top media section */}
      {isVideo && youtubeId ? (
        <a
          href={resource.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-video bg-muted overflow-hidden"
        >
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
            alt={resource.titleEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
              <PlaySquare className="w-7 h-7 text-white fill-white" />
            </div>
          </div>
          <div className="absolute top-3 left-3">
            <Badge className="bg-rose-600 text-white border-none text-[10px] font-bold">Video</Badge>
          </div>
        </a>
      ) : isImage && resource.fileUrl ? (
        <a
          href={resource.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-video bg-muted overflow-hidden"
        >
          <img
            src={resource.fileUrl}
            alt={resource.titleEn}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-emerald-600 text-white border-none text-[10px] font-bold">Image</Badge>
          </div>
        </a>
      ) : (
        <div className="h-32 bg-gradient-to-br from-nejah-sapphire/10 to-nejah-electric/5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center">
            {resource.thumbnailUrl ? (
              <img src={resource.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              getFileIcon(resource.resourceType)
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-nejah-sapphire text-foreground line-clamp-1">{resource.titleEn}</h3>
          <Badge variant="outline" className="text-[10px] font-bold bg-muted/50 shrink-0">{resource.resourceType}</Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{resource.descriptionEn || 'Helpful material for your current learning path.'}</p>

        {!isVideo && (
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span>{resource.category}</span>
            {resource.fileSize > 0 && <><span>•</span><span>{formatSize(resource.fileSize)}</span></>}
          </div>
        )}

        <div className="mt-auto pt-5 flex gap-2">
          {isVideo && resource.youtubeUrl ? (
            <Button onClick={() => onOpen(resource)} className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-2">
              <PlaySquare className="w-4 h-4" /> Watch
            </Button>
          ) : (
            <Button onClick={() => onOpen(resource)} className="flex-1 rounded-xl bg-nejah-sapphire hover:bg-nejah-sapphire/90 text-white">
              Open
            </Button>
          )}
          <Button onClick={() => onDetail(resource)} variant="secondary" className="rounded-xl bg-nejah-blue/5 hover:bg-nejah-blue/10 text-nejah-sapphire text-foreground">
            Details
          </Button>
          {resource.fileUrl && !resource.youtubeUrl && (
            <Button onClick={() => onDownload(resource)} variant="outline" className="px-3 rounded-xl border-nejah-blue/20 text-nejah-sapphire text-foreground">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentLevel, setStudentLevel] = useState('All Levels');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedResource, setSelectedResource] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, selectedType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAll, resFeat, resRec, resCat, resHist, profile] = await Promise.all([
        api(`/resources?search=${encodeURIComponent(search)}&category=${encodeURIComponent(selectedCategory)}&type=${encodeURIComponent(selectedType)}`),
        api('/resources/featured'),
        api('/resources/recent'),
        api('/resources/categories'),
        api('/resources/downloads'),
        api('/student/profile').catch(() => null),
      ]);
      setResources(resAll);
      setFeatured(resFeat);
      setRecent(resRec);
      setCategories(['All', ...resCat]);
      setDownloadHistory(resHist);
      setStudentLevel(profile?.student?.level || 'All Levels');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const levelHint = useMemo(() => {
    const normalized = (studentLevel || 'All Levels').toLowerCase();
    if (normalized.includes('qaida')) return 'Qaida Nooraniya';
    if (normalized.includes('reading')) return 'Quran Reading';
    if (normalized.includes('tajweed')) return 'Tajweed';
    if (normalized.includes('hifz')) return 'Hifz';
    return 'All Levels';
  }, [studentLevel]);

  const groupedResources = useMemo(() => {
    const sections = [
      {
        title: 'Quran Class Videos',
        items: resources.filter(
          (r) => r.category?.toLowerCase().includes('video') || r.resourceType?.toLowerCase().includes('video'),
        ),
      },
      {
        title: 'Class Notes',
        items: resources.filter(
          (r) => r.category?.toLowerCase().includes('note') || r.category?.toLowerCase().includes('study'),
        ),
      },
      {
        title: 'Additional Resources',
        items: resources.filter(
          (r) =>
            !r.category?.toLowerCase().includes('video') &&
            !r.category?.toLowerCase().includes('note') &&
            !r.category?.toLowerCase().includes('study'),
        ),
      },
    ];
    return sections.filter((s) => s.items.length > 0);
  }, [resources]);

  const handleOpenResource = (resource: any) => {
    if (resource.youtubeUrl) {
      window.open(resource.youtubeUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = async (resource: any) => {
    try {
      await api(`/resources/${resource.id}/download`, { method: 'POST' });
      const a = document.createElement('a');
      a.href = resource.fileUrl;
      a.download = resource.titleEn || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      api('/resources/downloads').then(setDownloadHistory).catch(console.error);
    } catch (err) {
      console.error('Failed to download', err);
    }
  };

  if (loading && resources.length === 0) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.resources}>
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-foreground font-serif">Learning Resources</h1>
          <p className="text-muted-foreground mt-2">Study materials and guides tailored to your current learning level.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-nejah-blue/20 bg-nejah-blue/5 px-4 py-2 text-sm text-foreground">
            <Sparkles className="h-4 w-4" /> Active level: <span className="font-semibold">{levelHint}</span>
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && !search && selectedCategory === 'All' && selectedType === 'All' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" /> Featured Materials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((r) => (
                <div key={r.id} className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-amber-500 text-white border-none shadow-sm">Featured</Badge>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                    {r.thumbnailUrl ? (
                      <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      getFileIcon(r.resourceType)
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground line-clamp-1">{r.titleEn}</h3>
                  <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{r.descriptionEn || 'No description provided.'}</p>
                  <div className="flex items-center gap-2 mt-4 text-xs font-medium text-muted-foreground">
                    <span>{r.category}</span> • <span>{formatSize(r.fileSize)}</span>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setSelectedResource(r)} className="flex-1 rounded-xl bg-nejah-sapphire hover:bg-nejah-sapphire/90 text-white">View</Button>
                    <Button onClick={() => handleDownload(r)} variant="outline" className="px-4 rounded-xl text-foreground border-nejah-blue/20"><Download className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Filters */}
            <div className="bg-card rounded-[32px] p-6 border shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, description..."
                    className="pl-9 h-12 rounded-2xl border-nejah-blue/20 focus-visible:ring-nejah-blue/20"
                  />
                </div>
              </div>

              {/* Type filter */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {TYPE_FILTERS.map((t) => (
                  <Button
                    key={t}
                    variant={selectedType === t ? 'default' : 'outline'}
                    onClick={() => setSelectedType(t)}
                    className={`rounded-xl whitespace-nowrap text-sm ${
                      selectedType === t
                        ? 'bg-nejah-sapphire hover:bg-nejah-sapphire/90 shadow-sm text-white'
                        : 'border-nejah-blue/20 text-foreground hover:bg-muted'
                    }`}
                  >
                    {t}
                  </Button>
                ))}
              </div>

              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl whitespace-nowrap text-sm ${
                      selectedCategory === cat
                        ? 'bg-nejah-sapphire hover:bg-nejah-sapphire/90 shadow-sm text-white'
                        : 'border-nejah-blue/20 text-foreground hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Resource sections */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Resources for your level</h2>
                <Badge variant="outline" className="rounded-full px-3">{resources.length} items</Badge>
              </div>

              {groupedResources.length > 0 ? (
                <div className="space-y-8">
                  {groupedResources.map((section) => (
                    <section key={section.title} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-nejah-electric" />
                        <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {section.items.map((resource) => (
                          <ResourceCard
                            key={resource.id}
                            resource={resource}
                            onOpen={handleOpenResource}
                            onDownload={handleDownload}
                            onDetail={setSelectedResource}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-dashed rounded-[32px] p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">No resources found</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    {search || selectedCategory !== 'All' || selectedType !== 'All'
                      ? 'Try adjusting your search or filters.'
                      : `Your learning level (${levelHint}) currently has no active resources. Please check back soon.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recently Added */}
            {recent.length > 0 && (
              <div className="bg-card rounded-[32px] p-6 border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-nejah-electric" /> Recently Added
                </h3>
                <div className="space-y-3">
                  {recent.map((r) => (
                    <div key={r.id} onClick={() => setSelectedResource(r)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        {getFileIcon(r.resourceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{r.titleEn}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download History */}
            <div className="bg-card rounded-[32px] p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" /> Download History
              </h3>
              {downloadHistory.length > 0 ? (
                <div className="space-y-3">
                  {downloadHistory.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-muted">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm font-bold text-foreground truncate">{d.resource?.titleEn}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(d.downloadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button onClick={() => handleDownload(d.resource)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0 text-foreground hover:bg-nejah-blue/10">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-6 border border-dashed rounded-2xl">You haven't downloaded anything yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Details Modal */}
      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[32px] p-0 overflow-hidden border-0">
          {selectedResource && (
            <div className="flex flex-col max-h-[80vh]">
              {selectedResource.thumbnailUrl ? (
                <div className="h-48 w-full relative">
                  <img src={selectedResource.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div className="h-32 w-full bg-gradient-to-r from-nejah-sapphire to-nejah-electric flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-white/20" />
                </div>
              )}

              <div className="p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2 font-bold uppercase tracking-wider text-[10px]">{selectedResource.category}</Badge>
                    <DialogTitle className="text-2xl font-bold text-foreground">{selectedResource.titleEn}</DialogTitle>
                    {selectedResource.titleAr && <p className="text-lg font-arabic text-muted-foreground mt-1 text-right" dir="rtl">{selectedResource.titleAr}</p>}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-2xl p-4 border grid grid-cols-3 gap-4 text-center mb-6 mt-2">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Type</p>
                    <p className="font-bold text-sm mt-1">{selectedResource.resourceType}</p>
                  </div>
                  <div className="border-x border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Size</p>
                    <p className="font-bold text-sm mt-1">{formatSize(selectedResource.fileSize)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Date</p>
                    <p className="font-bold text-sm mt-1">{new Date(selectedResource.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                  {selectedResource.descriptionEn && <p>{selectedResource.descriptionEn}</p>}
                  {selectedResource.descriptionAr && <p className="font-arabic text-right text-base" dir="rtl">{selectedResource.descriptionAr}</p>}
                </div>

                <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                  <Button onClick={() => setSelectedResource(null)} variant="outline" className="rounded-xl px-6">Close</Button>
                  {selectedResource.youtubeUrl ? (
                    <Button onClick={() => window.open(selectedResource.youtubeUrl, '_blank', 'noopener,noreferrer')} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-6 gap-2">
                      <ExternalLink className="w-4 h-4" /> Open Video
                    </Button>
                  ) : (
                    <Button onClick={() => handleDownload(selectedResource)} className="rounded-xl bg-nejah-sapphire hover:bg-nejah-sapphire/90 text-white px-6 gap-2">
                      <Download className="w-4 h-4" /> Download File
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/resources')({
  component: StudentResources,
  beforeLoad: requireStudentAuth,
});
