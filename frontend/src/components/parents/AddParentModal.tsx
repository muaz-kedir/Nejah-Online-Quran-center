import { API_BASE } from "@/lib/api";
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
import { UserPlus } from 'lucide-react';

interface AddParentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddParentModal({ open, onClose, onSuccess }: AddParentModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    residency: '',
    relationshipWithStudent: 'Father',
    password: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/parents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to add parent');
      }
      toast.success('Parent added successfully');
      onSuccess();
      onClose();
      setForm({ fullName: '', email: '', phoneNumber: '', residency: '', relationshipWithStudent: 'Father', password: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby="add-parent-desc" className="sm:max-w-[520px] rounded-3xl p-0 overflow-hidden dark:bg-nejah-surface dark:border-nejah-border-blue">
        {/* Header */}
        <div className="bg-gradient-to-r from-nejah-azure to-nejah-sapphire px-7 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">Add New Parent</DialogTitle>
                <DialogDescription id="add-parent-desc" className="text-nejah-electric text-xs mt-0.5">
                  Register a guardian profile in the Nejah ecosystem
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="e.g. Ahmed Al-Farsi"
                className="h-11 rounded-xl bg-muted dark:bg-nejah-surface border-border dark:border-nejah-border-blue"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="parent@example.com"
                className="h-11 rounded-xl bg-muted dark:bg-nejah-surface border-border dark:border-nejah-border-blue"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
                Phone Number
              </Label>
              <Input
                value={form.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="+971 50 123 4567"
                className="h-11 rounded-xl bg-muted dark:bg-nejah-surface border-border dark:border-nejah-border-blue"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
                Residency
              </Label>
              <Input
                value={form.residency}
                onChange={(e) => handleChange('residency', e.target.value)}
                placeholder="e.g. United Arab Emirates"
                className="h-11 rounded-xl bg-muted dark:bg-nejah-surface border-border dark:border-nejah-border-blue"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
                Relationship
              </Label>
              <Select value={form.relationshipWithStudent} onValueChange={(v) => handleChange('relationshipWithStudent', v)}>
                <SelectTrigger className="h-11 rounded-xl bg-muted dark:bg-nejah-surface border-border dark:border-nejah-border-blue">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                  <SelectItem value="Grandparent">Grandparent</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Set a secure password"
                className="h-11 rounded-xl bg-muted dark:bg-nejah-surface border-border dark:border-nejah-border-blue"
                required
              />
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 border-border dark:border-nejah-border-blue dark:text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl h-11 bg-primary hover:bg-nejah-azure text-white"
            >
              {loading ? 'Adding...' : 'Add Parent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
