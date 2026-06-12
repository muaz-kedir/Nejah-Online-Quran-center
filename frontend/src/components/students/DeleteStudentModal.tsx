import { useState } from 'react';
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
import { toast } from 'sonner';

interface DeleteStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string | null;
  studentName: string | null;
}

export function DeleteStudentModal({
  open,
  onClose,
  onSuccess,
  studentId,
  studentName,
}: DeleteStudentModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!studentId) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete student');
      }

      toast.success('Student deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground text-red-600">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="dark:text-muted-foreground">
            This will permanently delete the student record for{' '}
            <span className="font-bold text-foreground text-foreground">
              {studentName}
            </span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="dark:border-nejah-border-blue dark:text-muted-foreground">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white border-none"
          >
            {loading ? 'Deleting...' : 'Delete Student'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
