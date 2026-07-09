import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiUrl, apiHeaders } from "@/lib/api";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.currentPassword || !form.newPassword || form.newPassword !== form.confirmPassword) {
      toast.error("Check password fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/users/change-password"), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
      toast.success("Password updated");
      onOpenChange(false);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    {
      key: "currentPassword" as const,
      label: "Current",
      show: show.current,
      toggle: () => setShow((s) => ({ ...s, current: !s.current })),
    },
    {
      key: "newPassword" as const,
      label: "New",
      show: show.new,
      toggle: () => setShow((s) => ({ ...s, new: !s.new })),
    },
    {
      key: "confirmPassword" as const,
      label: "Confirm",
      show: show.confirm,
      toggle: () => setShow((s) => ({ ...s, confirm: !s.confirm })),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {fields.map(({ key, label, show, toggle }) => (
            <div key={key}>
              <Label>{label}</Label>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={toggle}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="bg-nejah-sapphire rounded-xl">
            {saving ? "Saving..." : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
