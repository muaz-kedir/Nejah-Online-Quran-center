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

interface DeleteTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacherId: string;
  teacherName: string;
}

export function DeleteTeacherModal({ open, onClose, onSuccess, teacherId, teacherName }: DeleteTeacherModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!teacherId) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete teacher');
      }

      toast.success('Teacher deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[440px] dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 mb-4 animate-bounce">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold dark:text-gray-100">Delete Teacher</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Are you sure you want to delete <span className="font-semibold text-gray-800 dark:text-gray-200">{teacherName}</span>?
            This will permanently remove their records, assigned students associations, and delete their system user login credentials. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-2 mt-4 sm:space-x-0">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-300">
            Cancel
          </Button>
          <Button type="button" onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
