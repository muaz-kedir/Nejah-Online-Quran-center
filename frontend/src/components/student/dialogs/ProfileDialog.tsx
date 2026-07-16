import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiUrl, apiHeaders } from "@/lib/api";
import { Camera, Loader2 } from "lucide-react";

interface StudentProfile {
  student?: {
    id: string;
    fullName?: string;
    firstName?: string;
    email?: string;
    phone?: string;
    country?: string;
    city?: string;
    level?: string;
    enrollmentDate?: string;
    assignedTeacher?: string;
    avatarUrl?: string | null;
  };
  statistics?: {
    attendancePercentage?: number;
    progressPercentage?: number;
    homeworkCompletionRate?: number;
  };
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile | null;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function ProfileDialog({
  open,
  onOpenChange,
  profile,
}: ProfileDialogProps) {
  const [phone, setPhone] = useState(profile?.student?.phone || "");
  const [email, setEmail] = useState(profile?.student?.email || "");
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(
    profile?.student?.avatarUrl,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync form fields when profile changes
  if (open) {
    // Only sync on open, not on every render
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(apiUrl("/uploads"), {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      await fetch(apiUrl("/users/profile"), {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ avatar: url }),
      });

      setAvatarUrl(url);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    try {
      await fetch(apiUrl("/users/profile"), {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ phone, email }),
      });
      toast.success("Profile updated");
      onOpenChange(false);
    } catch {
      toast.error("Could not update profile");
    }
  };

  const s = profile?.student;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="size-24 rounded-full overflow-hidden ring-2 ring-nejah-electric/20 bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={s?.fullName || ""}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-nejah-electric">
                    {s?.fullName?.charAt(0) || "S"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 size-8 rounded-full bg-nejah-electric text-white flex items-center justify-center shadow-lg hover:bg-nejah-electric/90 transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground text-lg">{s?.fullName}</p>
              <p className="text-xs text-muted-foreground">{s?.level || "Quran Reading"}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 rounded-2xl bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Teacher</p>
                <p className="font-medium text-foreground">{s?.assignedTeacher || "Not assigned"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Enrolled</p>
                <p className="font-medium text-foreground">{formatDate(s?.enrollmentDate)}</p>
              </div>
              {s?.country && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Country</p>
                  <p className="font-medium text-foreground">{s.country}</p>
                </div>
              )}
              {s?.city && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">City</p>
                  <p className="font-medium text-foreground">{s.city}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {profile?.statistics?.attendancePercentage ?? "—"}%
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
                Attendance
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {profile?.statistics?.progressPercentage ?? "—"}%
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
                Progress
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {profile?.statistics?.homeworkCompletionRate ?? "—"}%
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
                Homework
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl"
          >
            Close
          </Button>
          <Button
            onClick={saveProfile}
            className="flex-1 rounded-xl bg-nejah-sapphire hover:bg-nejah-surface text-white"
          >
            Save Contact Info
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
