/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useCallback, memo } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Phone,
  Mail,
  UserPlus,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { AmbientSection, PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { AddParentModal } from '@/components/parents/AddParentModal';
import { EditParentModal } from '@/components/parents/EditParentModal';
import { DeleteParentModal } from '@/components/parents/DeleteParentModal';
import { ViewParentModal } from '@/components/parents/ViewParentModal';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { useApiQuery } from "@/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute('/parents')({
  component: ParentsPage,
});

const getInitials = (name: string) => {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarBg = (name: string) => {
  const palettes = [
    'bg-primary/10 text-nejah-electric dark:bg-primary/20 dark:text-nejah-electric',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  ];
  return palettes[name.charCodeAt(0) % palettes.length];
};

const getStudentBadgeColor = (level?: string) => {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return 'bg-primary/10 text-nejah-electric dark:bg-primary/20 dark:text-nejah-electric';
    case 'intermediate':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300';
    case 'advanced':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300';
    case 'hifz':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
    default:
      return 'bg-muted text-foreground dark:bg-nejah-surface dark:text-muted-foreground';
  }
};

const parentIdCode = (id: string) => {
  const hash = id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `NEJ-${hash || '0000'}`;
};

const ParentRow = memo(function ParentRow({ parent, onView, onEdit, onDelete }: {
  parent: any;
  onView: (p: any) => void;
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
}) {
  return (
    <tr
      className="hover:bg-primary/5 transition-colors group"
    >
      {/* Parent Name */}
      <td className="py-5 px-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
              getAvatarBg(parent.fullName)
            )}
          >
            {getInitials(parent.fullName)}
          </div>
          <div>
            <p className="font-bold text-foreground dark:text-foreground group-hover:text-nejah-sapphire dark:group-hover:text-nejah-electric transition-colors">
              {parent.fullName}
            </p>
            <p className="text-xs text-nejah-slate-blue mt-0.5">
              ID: {parentIdCode(parent.id)}
            </p>
          </div>
        </div>
      </td>

      {/* Students */}
      <td className="py-5 px-6">
        {parent.students && parent.students.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-nejah-sapphire dark:text-nejah-electric">
              {parent.students.length > 2
                ? `${parent.students[0].fullName} +${parent.students.length - 1}`
                : parent.students.map((s: any) => s.fullName).join(' & ')}
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full w-fit',
                parent.students.length > 1
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                  : getStudentBadgeColor(parent.students[0]?.level)
              )}
            >
              {parent.students.length > 1
                ? 'Mixed Grades'
                : parent.students[0]?.level || 'Unassigned'}
            </span>
          </div>
        ) : (
          <span className="text-sm text-nejah-slate-blue italic">
            No students linked
          </span>
        )}
      </td>

      {/* Contact Information */}
      <td className="py-5 px-6">
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-nejah-slate-blue">
            <Phone className="h-3.5 w-3.5 text-nejah-slate-blue flex-shrink-0" />
            <span>{parent.phoneNumber || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-nejah-slate-blue">
            <Mail className="h-3.5 w-3.5 text-nejah-slate-blue flex-shrink-0" />
            <span className="truncate max-w-[200px]">{parent.email}</span>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="py-5 px-6">
        <div className="flex justify-center">
          <Badge
            className={cn(
              'text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 border-none flex items-center gap-1.5 w-max',
              parent.status?.toLowerCase() === 'active'
                ? 'bg-primary/10 text-nejah-electric dark:bg-primary/20 dark:text-nejah-electric'
                : 'bg-muted text-muted-foreground dark:bg-nejah-surface dark:text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                parent.status?.toLowerCase() === 'active'
                  ? 'bg-primary'
                  : 'bg-nejah-slate-blue'
              )}
            />
            {parent.status || 'Active'}
          </Badge>
        </div>
      </td>

      {/* Actions */}
      <td className="py-5 px-6">
        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onView(parent)}
            className="p-2 hover:bg-primary/10 dark:hover:bg-nejah-surface text-muted-foreground hover:text-nejah-electric dark:hover:text-nejah-electric rounded-lg transition-colors cursor-pointer"
            title="View Profile"
          >
            <Eye className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => onEdit(parent)}
            className="p-2 hover:bg-blue-50 dark:hover:bg-nejah-surface text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => onDelete(parent)}
            className="p-2 hover:bg-red-50 dark:hover:bg-nejah-surface text-muted-foreground hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </td>
    </tr>
  );
});

function ParentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<any | null>(null);
  const [deletingParent, setDeletingParent] = useState<any | null>(null);
  const [viewingParent, setViewingParent] = useState<any | null>(null);

  const PAGE_SIZE = 5;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: PAGE_SIZE.toString(),
  });
  if (search) params.append('search', search);
  if (statusFilter !== 'all') params.append('status', statusFilter);

  const { data: res, isLoading: loading } = useApiQuery<any>({
    queryKey: ["parents", { page, statusFilter }],
    path: `/parents?${params}`,
    refetchInterval: 30_000,
  });

  let parents: any[] = [];
  let meta = { total: 0, page, limit: PAGE_SIZE, totalPages: 1 };

  if (res && Array.isArray(res.data)) {
    parents = res.data;
    const resMeta = res.meta || {};
    meta = {
      total: resMeta.total || res.data.length,
      page: resMeta.page || page,
      limit: PAGE_SIZE,
      totalPages: resMeta.totalPages || Math.ceil((resMeta.total || res.data.length) / PAGE_SIZE),
    };
  } else if (Array.isArray(res)) {
    const total = res.length;
    const startIdx = (page - 1) * PAGE_SIZE;
    parents = res.slice(startIdx, startIdx + PAGE_SIZE);
    meta = { total, page, limit: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  const fetchParents = () => {
    queryClient.invalidateQueries({ queryKey: ["parents"] });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClassFilter('all');
    setPage(1);
  };

  const handleViewParent = useCallback((parent: any) => setViewingParent(parent), []);
  const handleEditParent = useCallback((parent: any) => setEditingParent(parent), []);
  const handleDeleteParent = useCallback((parent: any) => setDeletingParent(parent), []);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* ─── Header Section ─── */}
        <PageHeader
          eyebrow="Management"
          title="Parents"
          description="Manage guardian profiles, monitor student linkages, and oversee communication status within the Nejah ecosystem."
          actions={
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-br from-nejah-sapphire to-nejah-surface hover:from-nejah-electric hover:to-nejah-sapphire text-white gap-2 h-12 px-7 rounded-xl font-semibold shadow-lg shadow-nejah-sapphire/20 hover:scale-[1.02] transition-transform"
            >
              <UserPlus className="h-5 w-5" />
              Add Parent
            </Button>
          }
        />

        {/* ─── Filters Bento Card ─── */}
        <GlassPanel className="p-5 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nejah-slate-blue" />
              <Input
                placeholder="Search for parents or students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-background/50 border-none rounded-xl"
              />
            </form>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest ml-1 mb-1.5">
                Filter by Status
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-11 rounded-xl bg-background/50 border-none">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-white/5">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest ml-1 mb-1.5">
                Class Assignment
              </span>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[160px] h-11 rounded-xl bg-background/50 border-none">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-white/5">
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="grade1">Grade 1</SelectItem>
                  <SelectItem value="grade2">Grade 2</SelectItem>
                  <SelectItem value="grade3">Grade 3</SelectItem>
                  <SelectItem value="grade4">Grade 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchParents}
              className="h-11 px-6 bg-nejah-sapphire hover:bg-background text-white font-semibold rounded-xl border-none"
            >
              Apply Filters
            </Button>

            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-11 w-11 rounded-xl p-0 hover:bg-primary/10 dark:hover:bg-nejah-surface text-nejah-electric dark:text-nejah-electric"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </GlassPanel>

        {/* ─── Table Card ─── */}
        <GlassPanel className="overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background/50 border-b border-white/5">
                  <th className="text-left py-4 px-6 text-[10px] font-semibold text-nejah-slate-blue uppercase tracking-widest">
                    Parent Name
                  </th>
                  <th className="text-left py-4 px-6 text-[10px] font-semibold text-nejah-slate-blue uppercase tracking-widest">
                    Students
                  </th>
                  <th className="text-left py-4 px-6 text-[10px] font-semibold text-nejah-slate-blue uppercase tracking-widest">
                    Contact Information
                  </th>
                  <th className="text-center py-4 px-6 text-[10px] font-semibold text-nejah-slate-blue uppercase tracking-widest">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 text-[10px] font-semibold text-nejah-slate-blue uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-muted dark:bg-nejah-surface" />
                          <div className="space-y-2">
                            <div className="h-3 w-28 bg-muted dark:bg-nejah-surface rounded" />
                            <div className="h-2.5 w-16 bg-muted dark:bg-nejah-surface rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="h-3 w-24 bg-muted dark:bg-nejah-surface rounded" />
                      </td>
                      <td className="py-5 px-6">
                        <div className="space-y-2">
                          <div className="h-3 w-32 bg-muted dark:bg-nejah-surface rounded" />
                          <div className="h-3 w-40 bg-muted dark:bg-nejah-surface rounded" />
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="h-6 w-16 mx-auto bg-muted dark:bg-nejah-surface rounded-full" />
                      </td>
                      <td className="py-5 px-6">
                        <div className="h-6 w-20 ml-auto bg-muted dark:bg-nejah-surface rounded" />
                      </td>
                    </tr>
                  ))
                ) : parents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-background/50 flex items-center justify-center">
                          <Search className="h-7 w-7 text-nejah-slate-blue" />
                        </div>
                        <p className="text-nejah-slate-blue font-medium font-serif text-lg">
                          No parents found
                        </p>
                        <p className="text-nejah-slate-blue/60 text-sm">
                          Try adjusting your filters or add a new parent
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  parents.map((parent) => (
                    <ParentRow key={parent.id} parent={parent} onView={handleViewParent} onEdit={handleEditParent} onDelete={handleDeleteParent} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Pagination ─── */}
          <div className="px-6 py-4 border-t border-white/5 bg-background/30 flex items-center justify-between">
            <p className="text-xs text-nejah-slate-blue">
              Showing{' '}
              <span className="font-bold text-foreground">
                {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0}-
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-foreground">{meta.total}</span>{' '}
              parents
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                disabled={meta.page === 1}
                onClick={() => setPage(meta.page - 1)}
                className="h-8 w-8 rounded-lg dark:border-white/10 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }).map((_, i) => (
                <Button
                  key={i}
                  variant={meta.page === i + 1 ? 'default' : 'outline'}
                    onClick={() => setPage(i + 1)}
                  className={cn(
                    'h-8 w-8 rounded-lg font-bold text-xs border-none',
                    meta.page === i + 1
                      ? 'bg-nejah-sapphire hover:bg-background text-white'
                      : 'bg-transparent text-nejah-slate-blue hover:bg-primary/10 dark:hover:bg-nejah-surface hover:text-nejah-sapphire'
                  )}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(meta.page + 1)}
                className="h-8 w-8 rounded-lg dark:border-white/10 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassPanel>

      </div>

      {/* ─── Modals ─── */}
      <AddParentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchParents}
      />

      <EditParentModal
        open={!!editingParent}
        onClose={() => setEditingParent(null)}
        onSuccess={fetchParents}
        parent={editingParent}
      />

      <DeleteParentModal
        open={!!deletingParent}
        onClose={() => setDeletingParent(null)}
        onSuccess={fetchParents}
        parentId={deletingParent?.id || null}
        parentName={deletingParent?.fullName || null}
      />

      <ViewParentModal
        open={!!viewingParent}
        onClose={() => setViewingParent(null)}
        parent={viewingParent}
      />
    </DashboardLayout>
  );
}
