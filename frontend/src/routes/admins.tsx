import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Shield, Mail, Phone, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/admins')({
  component: AdminsPage,
  beforeLoad: () => requireAuth(['super_admin']),
});

function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.append('search', search);
      params.append('role', 'admin');

      const res = await fetch(`http://localhost:3000/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setAdmins(result.data || []);
    } catch (error) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, [search]);

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">Manage system administrators</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" /> Add Admin
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search admins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading...</div>
        ) : admins.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">No admins found</div>
        ) : (
          admins.map((admin: any) => (
            <div key={admin.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                  <Badge className="bg-purple-100 text-purple-700">{admin.role.replace('_', ' ').toUpperCase()}</Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {admin.email}
                </div>
                {admin.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {admin.phone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Joined {new Date(admin.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                  {admin.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
