import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';

interface Parent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  residency?: string;
  relationshipWithStudent?: string;
  status?: string;
}

interface EditParentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parent: Parent | null;
}

export function EditParentModal({ open, onClose, onSuccess, parent }: EditParentModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    residency: '',
    relationshipWithStudent: 'Father',
    status: 'active',
  });

  useEffect(() => {
    if (parent) {
      setForm({
        fullName: parent.fullName || '',
        email: parent.email || '',
        phoneNumber: parent.phoneNumber || '',
        residency: parent.residency || '',
        relationshipWithStudent: parent.relationshipWithStudent || 'Father',
        status: parent.status || 'active',
      });
    }
  }, [parent]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parent?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/parents/${parent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update parent');
      }
      toast.success('Parent updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!parent) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby="edit-parent-desc" className="sm:max-w-[520px] rounded-3xl p-0 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-7 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <Pencil className="h-5 w-5" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Edit Parent</DialogTitle>
              <DialogDescription id="edit-parent-desc" className="text-blue-200 text-xs mt-0.5">
                Update guardian profile for {parent.fullName}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Email
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Phone Number
              </Label>
              <Input
                value={form.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="+971 50 123 4567"
                className="h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Residency
              </Label>
              <Input
                value={form.residency}
                onChange={(e) => handleChange('residency', e.target.value)}
                className="h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Relationship
              </Label>
              <Select value={form.relationshipWithStudent} onValueChange={(v) => handleChange('relationshipWithStudent', v)}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                  <SelectItem value="Grandparent">Grandparent</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Status
              </Label>
              <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 border-gray-200 dark:border-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl h-11 bg-blue-900 hover:bg-blue-800 text-white"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
