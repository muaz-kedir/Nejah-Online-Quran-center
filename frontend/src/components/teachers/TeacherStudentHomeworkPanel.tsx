import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, ClipboardList, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TeacherStudentHomeworkPanelProps {
  studentId: string;
}

function displayStatus(hw: { status: string; dueDate?: string }) {
  if (hw.status === 'Completed') return 'Completed';
  if (hw.dueDate && new Date(hw.dueDate) < new Date()) return 'Late';
  return 'Pending';
}

export function TeacherStudentHomeworkPanel({ studentId }: TeacherStudentHomeworkPanelProps) {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Medium',
    dueDate: '',
  });

  const fetchHomework = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<any[]>(`/homework/student/${studentId}`);
      setHomeworks(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load homework');
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreateLoading(true);
    try {
      await api('/homework', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          studentId,
          dueDate: new Date(formData.dueDate).toISOString(),
        }),
      });
      toast.success('Homework assigned successfully');
      setShowCreate(false);
      setFormData({ title: '', description: '', difficulty: 'Medium', dueDate: '' });
      fetchHomework();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create homework');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api(`/homework/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success('Status updated');
      fetchHomework();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/homework/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('Homework deleted');
      setDeleteTarget(null);
      fetchHomework();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = useMemo(
    () => homeworks.filter((h) => h.title?.toLowerCase().includes(search.toLowerCase())),
    [homeworks, search],
  );

  const getDifficultyColor = (d: string) => {
    const map: Record<string, string> = {
      Easy: 'bg-green-100 text-green-700',
      Medium: 'bg-amber-100 text-amber-700',
      High: 'bg-red-100 text-red-700',
    };
    return map[d] || 'bg-muted text-foreground';
  };

  const getStatusColor = (s: string) => {
    const map: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-700',
      Completed: 'bg-primary/10 text-primary',
      Late: 'bg-red-100 text-red-600',
    };
    return map[s] || 'bg-muted text-foreground';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search homework..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-none bg-muted dark:bg-nejah-surface"
          />
        </div>
        <Button
          className="bg-primary hover:bg-nejah-azure text-white rounded-xl"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Assign Homework
        </Button>
      </div>

      <div className="bg-card dark:bg-nejah-surface rounded-2xl border border-border dark:border-nejah-border-blue overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 dark:bg-nejah-surface/50">
              <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Title</th>
              <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Difficulty</th>
              <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
              <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Due Date</th>
              <th className="text-right p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  No homework assigned yet. Click &quot;Assign Homework&quot; to add one.
                </td>
              </tr>
            ) : (
              filtered.map((hw) => {
                const status = displayStatus(hw);
                return (
                  <tr key={hw.id} className="border-b border-border dark:border-nejah-border-blue hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <span className="font-medium text-nejah-sapphire text-foreground">{hw.title}</span>
                          {hw.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{hw.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getDifficultyColor(hw.difficulty)}>{hw.difficulty}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(status)}>{status}</Badge>
                        {hw.status !== 'Completed' && (
                          <select
                            value={hw.status}
                            onChange={(e) => handleStatusUpdate(hw.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1 bg-card dark:bg-nejah-surface"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(hw)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Assign Homework</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="hw-title">Title *</Label>
                <Input
                  id="hw-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g. Surah Al-Fatiha Memorization"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hw-desc">Description</Label>
                <Textarea
                  id="hw-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Assignment details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hw-due">Due Date *</Label>
                  <Input
                    id="hw-due"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createLoading} className="bg-primary hover:bg-nejah-azure">
                {createLoading ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Homework</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
