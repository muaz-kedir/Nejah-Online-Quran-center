/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { API_BASE } from "@/lib/api";
import { useState, useEffect, useMemo } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
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
import { Plus, Search, ClipboardList, Clock, User, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export const Route = createLazyFileRoute('/homework')({
  component: HomeworkPage,
});

function HomeworkPage() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Medium',
    dueDate: '',
    studentId: '',
  });

  const token = () => localStorage.getItem('token');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudents();
    if (selectedStudentId) await fetchHomework(selectedStudentId);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchHomework(selectedStudentId);
    } else {
      setHomeworks([]);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API}/students?limit=200`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load students', e);
    }
  };

  const fetchHomework = async (studentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/homework/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHomeworks(data || []);
      } else {
        setHomeworks([]);
      }
    } catch (error) {
      toast.error('Failed to load homework');
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.title || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(`${API}/homework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ ...formData, dueDate: new Date(formData.dueDate).toISOString() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create homework');
      }
      toast.success('Homework assigned successfully');
      setShowCreate(false);
      setFormData({ title: '', description: '', difficulty: 'Medium', dueDate: '', studentId: selectedStudentId });
      fetchHomework(selectedStudentId);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/homework/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update status');
      }
      toast.success('Status updated');
      fetchHomework(selectedStudentId);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API}/homework/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete');
      }
      toast.success('Homework deleted');
      setDeleteTarget(null);
      fetchHomework(selectedStudentId);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filtered = useMemo(() =>
    homeworks.filter((h: any) =>
      h.title?.toLowerCase().includes(search.toLowerCase())
    ),
    [homeworks, search]
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
    };
    return map[s] || 'bg-muted text-foreground';
  };

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Homework Management</h1>
          <p className="text-muted-foreground mt-1">Assign and track student homework</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 gap-2 rounded-xl px-4" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            className="bg-primary hover:bg-primary"
            disabled={!selectedStudentId}
            onClick={() => {
              setFormData({ ...formData, studentId: selectedStudentId });
              setShowCreate(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Assign Homework
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search homework..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-64">
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted">
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Title</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Student</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Difficulty</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Due Date</th>
              <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!selectedStudentId ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Select a student to view homework</td></tr>
            ) : loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No homework found for this student</td></tr>
            ) : (
              filtered.map((hw: any) => (
                <tr key={hw.id} className="border-b hover:bg-muted">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">{hw.title}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{hw.student?.fullName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={getDifficultyColor(hw.difficulty)}>{hw.difficulty}</Badge>
                  </td>
                  <td className="p-4">
                    <select
                      value={hw.status}
                      onChange={(e) => handleStatusUpdate(hw.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1 bg-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
              ))
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
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g. Surah Al-Fatiha Memorization"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Assignment details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
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
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading} className="bg-primary hover:bg-primary">
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
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
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
    </DashboardLayout>
  );
}
