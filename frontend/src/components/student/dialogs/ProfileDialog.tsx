import { useState } from "react";
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

interface StudentProfile {
  student?: {
    id: string;
    fullName?: string;
    phone?: string;
    email?: string;
    level?: string;
    enrollmentDate?: string;
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
  level: string;
  teacher: string;
  enrolled: string;
}

export function ProfileDialog({
  open,
  onOpenChange,
  profile,
  level,
  teacher,
  enrolled,
}: ProfileDialogProps) {
  const [phone, setPhone] = useState(profile?.student?.phone || "");
  const [email, setEmail] = useState(profile?.student?.email || "");

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm">
          <p>
            <strong>Name:</strong> {profile?.student?.fullName}
          </p>
          <p>
            <strong>Level:</strong> {level}
          </p>
          <p>
            <strong>Teacher:</strong> {teacher}
          </p>
          <p>
            <strong>Enrolled:</strong> {enrolled}
          </p>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="stat-card">
              <p className="font-bold text-foreground">
                {profile?.statistics?.attendancePercentage}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Attendance</p>
            </div>
            <div className="stat-card">
              <p className="font-bold text-foreground">
                {profile?.statistics?.progressPercentage}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Progress</p>
            </div>
            <div className="stat-card">
              <p className="font-bold text-foreground">
                {profile?.statistics?.homeworkCompletionRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Homework</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={saveProfile} className="bg-nejah-sapphire rounded-xl">
            Save Contact Info
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
