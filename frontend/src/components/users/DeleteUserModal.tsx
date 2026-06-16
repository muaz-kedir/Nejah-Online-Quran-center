import { API_BASE, apiUrl } from "@/lib/api";
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export function DeleteUserModal({ open, onClose, user, onSuccess }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);


  const handleDelete = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/users/${user.id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      toast.success('User deleted successfully');

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <DialogTitle>Delete User</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            Are you sure you want to delete <strong>{user.name}</strong> ({user.email})?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
