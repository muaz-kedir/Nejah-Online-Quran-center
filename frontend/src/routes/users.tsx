import { API_BASE } from "@/lib/api";
import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoleBadge } from '@/components/ui/role-badge';
import { AddUserModal } from '@/components/users/AddUserModal';
import { EditUserModal } from '@/components/users/EditUserModal';
import { DeleteUserModal } from '@/components/users/DeleteUserModal';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AmbientSection, PageHeader, GlassPanel } from '@/components/dashboard/design-system';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);



  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);

      const response = await fetch(`${API_BASE}/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const result = await response.json();
      setUsers(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  const handleToggleStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to toggle status');

      toast.success('User status updated successfully');

      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <DashboardLayout>
      <AmbientSection className="admin-page">
        <PageHeader
          eyebrow="System Users"
          title="User Management"
          actions={
            <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-nejah-sapphire">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          }
        />

        {/* Filters */}
        <div className="admin-filter-bar">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nejah-slate-blue" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl border-none pl-9"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-11 w-[160px] rounded-xl border-white/10 bg-background/50">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-[140px] rounded-xl border-white/10 bg-background/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <GlassPanel className="overflow-hidden rounded-3xl">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/5 bg-background/50 hover:bg-background/50">
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Name</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Email</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Role</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Status</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Created Date</TableHead>
                <TableHead className="text-right text-[10px] font-semibold uppercase tracking-widest text-nejah-slate-blue">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-nejah-slate-blue">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-nejah-slate-blue">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-nejah-slate-blue">{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-nejah-slate-blue">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-white/5 p-4">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="h-9 rounded-xl dark:border-nejah-border-blue"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-nejah-slate-blue">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="h-9 rounded-xl dark:border-nejah-border-blue"
              >
                Next
              </Button>
            </div>
          )}
        </GlassPanel>
      </AmbientSection>

      {/* Modals */}
      <AddUserModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchUsers}
      />

      {selectedUser && (
        <>
          <EditUserModal
            open={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={fetchUsers}
          />

          <DeleteUserModal
            open={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={fetchUsers}
          />
        </>
      )}
    </DashboardLayout>
  );
}
import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/users')({
  component: UsersPage,
  beforeLoad: () => requireAuth(['super_admin']),
});
