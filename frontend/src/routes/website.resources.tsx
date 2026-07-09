import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  FolderOpen, Plus, Search, Trash2, Edit, Loader2,
  UploadCloud, Settings, ListFilter, Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { toast } from 'sonner';

function WebsiteResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    titleEn: '', titleAr: '', titleAm: '',
    descriptionEn: '', descriptionAr: '', descriptionAm: '',
    category: 'Class Materials',
    learningLevel: 'All Levels',
    resourceType: 'PDF',
    fileUrl: '', thumbnailUrl: '',
    isFeatured: false, status: 'active', displayOrder: 0, fileSize: 0
  });

  useEffect(() => {
    fetchResources();
  }, [search]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await api(`/resources?search=${encodeURIComponent(search)}`);
      setResources(data);
    } catch (err) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (resource?: any) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        titleEn: resource.titleEn || '', titleAr: resource.titleAr || '', titleAm: resource.titleAm || '',
        descriptionEn: resource.descriptionEn || '', descriptionAr: resource.descriptionAr || '', descriptionAm: resource.descriptionAm || '',
        category: resource.category || 'Class Materials',
        learningLevel: resource.learningLevel || 'All Levels',
        resourceType: resource.resourceType || 'PDF',
        fileUrl: resource.fileUrl || '', thumbnailUrl: resource.thumbnailUrl || '',
        isFeatured: resource.isFeatured || false, status: resource.status || 'active', 
        displayOrder: resource.displayOrder || 0, fileSize: resource.fileSize || 0
      });
    } else {
      setEditingResource(null);
      setFormData({
        titleEn: '', titleAr: '', titleAm: '',
        descriptionEn: '', descriptionAr: '', descriptionAm: '',
        category: 'Class Materials', learningLevel: 'All Levels', resourceType: 'PDF',
        fileUrl: '', thumbnailUrl: '', isFeatured: false, status: 'active', displayOrder: 0, fileSize: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.titleEn || !formData.fileUrl) {
      toast.error('English Title and File URL are required');
      return;
    }
    try {
      if (editingResource) {
        await api(`/resources/${editingResource.id}`, { method: 'PATCH', body: JSON.stringify(formData) });
        toast.success('Resource updated successfully');
      } else {
        await api('/resources', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Resource created successfully');
      }
      setIsDialogOpen(false);
      fetchResources();
    } catch (err) {
      toast.error('Failed to save resource');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api(`/resources/${id}`, { method: 'DELETE' });
      toast.success('Resource deleted');
      fetchResources();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  if (loading && resources.length === 0) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </DashboardLayout>
  );

  return (
    <>
      <DashboardLayout>
        <main className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Learning Resources</h1>
              <p className="text-gray-500 mt-1">Manage study materials, worksheets, and media for students.</p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 px-6 h-12 shadow-md">
              <Plus className="w-5 h-5" /> Add Resource
            </Button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search resources by title or description..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-50 border-transparent focus:bg-white h-12 rounded-xl text-base"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="p-4 font-semibold text-gray-600 text-sm">Resource</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Classification</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Metrics</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resources.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {r.thumbnailUrl ? <img src={r.thumbnailUrl} className="w-full h-full object-cover" /> : <FolderOpen className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1">{r.titleEn}</p>
                            <p className="text-xs text-gray-500 font-medium">{r.resourceType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-gray-700">{r.learningLevel}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.category}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-gray-50 text-gray-600">
                          {r.downloadCount} Downloads
                        </Badge>
                        {r.isFeatured && <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>}
                      </td>
                      <td className="p-4">
                        <Badge className={r.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                          {r.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(r)} className="text-gray-500 hover:text-primary">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-gray-500 hover:text-rose-600 ml-1">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {resources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-500">
                        <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No resources found</p>
                        <p className="mt-1">Add your first learning resource to get started.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </DashboardLayout>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Layout className="w-4 h-4 text-gray-500"/> Basic Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Title (English) *</Label>
                  <Input value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Title (Arabic)</Label>
                  <Input value={formData.titleAr} onChange={e => setFormData({...formData, titleAr: e.target.value})} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>Description (English)</Label>
                  <Textarea value={formData.descriptionEn} onChange={e => setFormData({...formData, descriptionEn: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><ListFilter className="w-4 h-4 text-gray-500"/> Classification</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Learning Level</Label>
                  <Select value={formData.learningLevel} onValueChange={v => setFormData({...formData, learningLevel: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Levels">All Levels</SelectItem>
                      <SelectItem value="Qaida Nooraniya">Qaida Nooraniya</SelectItem>
                      <SelectItem value="Quran Reading">Quran Reading</SelectItem>
                      <SelectItem value="Tajweed">Tajweed</SelectItem>
                      <SelectItem value="Hifz">Hifz</SelectItem>
                      <SelectItem value="Islamic Studies">Islamic Studies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Worksheets, Videos" />
                </div>
                <div className="space-y-2">
                  <Label>Resource Type</Label>
                  <Select value={formData.resourceType} onValueChange={v => setFormData({...formData, resourceType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF Document</SelectItem>
                      <SelectItem value="MP4">Video (MP4)</SelectItem>
                      <SelectItem value="MP3">Audio (MP3)</SelectItem>
                      <SelectItem value="Image">Image (JPG/PNG)</SelectItem>
                      <SelectItem value="ZIP">Archive (ZIP)</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-gray-500"/> Media & URLs</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>File URL *</Label>
                  <Input value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Thumbnail URL (Optional)</Label>
                  <Input value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Settings className="w-4 h-4 text-gray-500"/> Settings</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Active Status</Label>
                    <p className="text-xs text-gray-500">Visible to students</p>
                  </div>
                  <Switch checked={formData.status === 'active'} onCheckedChange={(c) => setFormData({...formData, status: c ? 'active' : 'inactive'})} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Featured</Label>
                    <p className="text-xs text-gray-500">Pin to top of list</p>
                  </div>
                  <Switch checked={formData.isFeatured} onCheckedChange={(c) => setFormData({...formData, isFeatured: c})} />
                </div>
              </div>
            </div>

          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Resource</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const Route = createFileRoute('/website/resources')({
  component: WebsiteResources,
  beforeLoad: () => requireAuth(['super_admin']),
});
