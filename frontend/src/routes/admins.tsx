import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Shield, Wallet, BookOpen, Mail, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { AddUserModal } from '@/components/users/AddUserModal';

export const Route = createFileRoute('/admins')({
  component: AdminsPage,
  beforeLoad: () => requireAuth(['super_admin']),
});

function StaffGrid({ users, loading, icon: Icon, color }: { users: any[]; loading: boolean; icon: any; color: string }) {
  if (loading) return <div className="col-span-full py-12 text-center text-nejah-slate-blue">Loading...</div>;
  if (users.length === 0) return <div className="col-span-full py-12 text-center text-nejah-slate-blue">No users found</div>;
  return users.map((user) => (
    <div key={user.id} className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{user.name}</h3>
          <Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge>
        </div>
      </div>
      <div className="space-y-2 text-sm text-nejah-slate-blue">
        <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {user.email}</div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Joined {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className="mt-4 border-t border-white/10 pt-4">
        <Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>
    </div>
  ));
}

function AdminsPage() {
  const [tab, setTab] = useState<'admin' | 'finance_manager' | 'qirat_manager'>('admin');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [defaultRole, setDefaultRole] = useState('admin');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '100', role: tab });
      if (search) params.append('search', search);
      const res = await fetch(`http://localhost:3000/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setUsers(result.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, tab]);

  const openAdd = (role: string) => {
    setDefaultRole(role);
    setShowAdd(true);
  };

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Staff Management"
        title="Staff Management"
        description="Create admin, finance manager, and qirat manager accounts"
        actions={
          <Button onClick={() => openAdd(tab)}>
            <Plus className="mr-2 h-4 w-4" />
            Add {tab === 'admin' ? 'Admin' : tab === 'finance_manager' ? 'Finance Manager' : 'Qirat Manager'}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'admin' | 'finance_manager' | 'qirat_manager')} className="mb-6">
        <TabsList>
          <TabsTrigger value="admin"><Shield className="mr-2 h-4 w-4" /> Admins</TabsTrigger>
          <TabsTrigger value="finance_manager"><Wallet className="mr-2 h-4 w-4" /> Finance Managers</TabsTrigger>
          <TabsTrigger value="qirat_manager"><BookOpen className="mr-2 h-4 w-4" /> Qirat Managers</TabsTrigger>
        </TabsList>
        <TabsContent value="admin" className="mt-4">
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-nejah-slate-blue" />
            <Input placeholder="Search admins..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StaffGrid users={users} loading={loading} icon={Shield} color="bg-primary/15 text-nejah-electric" />
          </div>
        </TabsContent>
        <TabsContent value="finance_manager" className="mt-4">
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-nejah-slate-blue" />
            <Input placeholder="Search finance managers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StaffGrid users={users} loading={loading} icon={Wallet} color="bg-amber-500/15 text-amber-600" />
          </div>
        </TabsContent>
        <TabsContent value="qirat_manager" className="mt-4">
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-nejah-slate-blue" />
            <Input placeholder="Search qirat managers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StaffGrid users={users} loading={loading} icon={BookOpen} color="bg-primary/100/15 text-primary" />
          </div>
        </TabsContent>
      </Tabs>

      <AddUserModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={fetchUsers}
        defaultRole={defaultRole}
      />
    </DashboardLayout>
  );
}
