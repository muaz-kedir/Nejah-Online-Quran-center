import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  FolderOpen, Search, Download, FileText, Image as ImageIcon,
  PlaySquare, Headphones, FileArchive, ArrowRight, Clock, Star, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';

function StudentResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedResource, setSelectedResource] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAll, resFeat, resRec, resCat, resHist] = await Promise.all([
        api(`/resources?search=${encodeURIComponent(search)}&category=${encodeURIComponent(selectedCategory)}`),
        api('/resources/featured'),
        api('/resources/recent'),
        api('/resources/categories'),
        api('/resources/downloads')
      ]);
      setResources(resAll);
      setFeatured(resFeat);
      setRecent(resRec);
      setCategories(['All', ...resCat]);
      setDownloadHistory(resHist);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('pdf') || t.includes('doc')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (t.includes('mp4') || t.includes('video')) return <PlaySquare className="w-5 h-5 text-rose-500" />;
    if (t.includes('mp3') || t.includes('audio')) return <Headphones className="w-5 h-5 text-amber-500" />;
    if (t.includes('img') || t.includes('png') || t.includes('jpg')) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    if (t.includes('zip')) return <FileArchive className="w-5 h-5 text-slate-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`;
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
      
      // Refresh history quietly
      api('/resources/downloads').then(setDownloadHistory).catch(console.error);
    } catch (err) {
      console.error('Failed to download', err);
    }
  };

  if (loading && resources.length === 0) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.resources}>
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-nejah-sapphire font-serif">Learning Resources</h1>
          <p className="text-muted-foreground mt-2">Study materials and guides assigned to your level.</p>
        </div>

        {/* 1. Featured Resources */}
        {featured.length > 0 && !search && selectedCategory === 'All' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-nejah-sapphire mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" /> Featured Materials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(r => (
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
                  <h3 className="text-xl font-bold text-nejah-sapphire line-clamp-1">{r.titleEn}</h3>
                  <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{r.descriptionEn || 'No description provided.'}</p>
                  <div className="flex items-center gap-2 mt-4 text-xs font-medium text-muted-foreground">
                    <span>{r.category}</span> • <span>{formatSize(r.fileSize)}</span>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setSelectedResource(r)} className="flex-1 rounded-xl bg-nejah-sapphire hover:bg-nejah-sapphire/90">View</Button>
                    <Button onClick={() => handleDownload(r)} variant="outline" className="px-4 rounded-xl text-nejah-sapphire border-nejah-sapphire/20"><Download className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* 2. Categories & Search */}
            <div className="bg-card rounded-[32px] p-6 border shadow-sm">
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
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  {categories.map(cat => (
                    <Button 
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-xl whitespace-nowrap ${selectedCategory === cat ? 'bg-nejah-sapphire hover:bg-nejah-sapphire/90 shadow-sm' : 'border-nejah-blue/20 text-foreground hover:bg-muted'}`}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. All Resources */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-nejah-sapphire">All Resources</h2>
                <Badge variant="outline" className="rounded-full px-3">{resources.length} items</Badge>
              </div>

              {resources.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {resources.map(r => (
                    <div key={r.id} className="bg-card border rounded-3xl p-5 hover:border-nejah-blue/40 transition-colors group flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                          {r.thumbnailUrl ? (
                            <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            getFileIcon(r.resourceType)
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold bg-muted/50">{r.resourceType}</Badge>
                      </div>
                      <h3 className="font-bold text-nejah-sapphire line-clamp-1">{r.titleEn}</h3>
                      {r.titleAr && <p className="text-sm font-arabic text-right mt-1 text-muted-foreground line-clamp-1">{r.titleAr}</p>}
                      
                      <div className="mt-auto pt-6 flex gap-2">
                        <Button onClick={() => setSelectedResource(r)} variant="secondary" className="flex-1 rounded-xl bg-nejah-blue/5 hover:bg-nejah-blue/10 text-nejah-sapphire">Details</Button>
                        <Button onClick={() => handleDownload(r)} variant="outline" className="px-3 rounded-xl border-nejah-blue/20 text-nejah-sapphire"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-dashed rounded-[32px] p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-nejah-sapphire">No resources found</h3>
                  <p className="text-muted-foreground mt-2">Try adjusting your search or category filters.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {/* 4. Recently Added */}
            {recent.length > 0 && (
              <div className="bg-card rounded-[32px] p-6 border shadow-sm">
                <h3 className="text-lg font-bold text-nejah-sapphire mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-nejah-electric" /> Recently Added
                </h3>
                <div className="space-y-3">
                  {recent.map(r => (
                    <div key={r.id} onClick={() => setSelectedResource(r)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        {getFileIcon(r.resourceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-nejah-sapphire truncate">{r.titleEn}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Download History */}
            <div className="bg-card rounded-[32px] p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-nejah-sapphire mb-4 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" /> Download History
              </h3>
              {downloadHistory.length > 0 ? (
                <div className="space-y-3">
                  {downloadHistory.slice(0, 5).map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-muted">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm font-bold text-nejah-sapphire truncate">{d.resource?.titleEn}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(d.downloadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button onClick={() => handleDownload(d.resource)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0 text-nejah-sapphire hover:bg-nejah-blue/10">
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

      {/* Resource Details Modal */}
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
                  <FolderOpen className="w-12 h-12 text-white/20" />
                </div>
              )}
              
              <div className="p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2 font-bold uppercase tracking-wider text-[10px]">{selectedResource.category}</Badge>
                    <DialogTitle className="text-2xl font-bold text-nejah-sapphire">{selectedResource.titleEn}</DialogTitle>
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
                  <Button onClick={() => handleDownload(selectedResource)} className="rounded-xl bg-nejah-sapphire hover:bg-nejah-sapphire/90 px-6 gap-2">
                    <Download className="w-4 h-4" /> Download File
                  </Button>
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
