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

interface DeleteParentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentId: string | null;
  parentName: string | null;
}

export function DeleteParentModal({ open, onClose, onSuccess, parentId, parentName }: DeleteParentModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!parentId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/parents/${parentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete parent');
      }
      toast.success('Parent deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete parent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby="delete-parent-desc" className="sm:max-w-[440px] dark:bg-nejah-surface dark:border-nejah-border-blue rounded-3xl p-6">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">Delete Parent</DialogTitle>
          <DialogDescription id="delete-parent-desc" className="text-sm text-muted-foreground dark:text-muted-foreground mt-2 leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground dark:text-foreground">{parentName}</span>?
            This will permanently remove their profile, linked student associations, and system access credentials. This action{' '}
            <span className="font-semibold text-red-600">cannot be undone</span>.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-2 mt-6 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-11 border-border dark:border-nejah-border-blue dark:text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11"
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
