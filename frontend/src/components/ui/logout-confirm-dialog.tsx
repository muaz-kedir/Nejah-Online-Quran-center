import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, AlertTriangle, X, User, Shield, GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName?: string;
  userRole?: string;
}

const roleIcons: Record<string, typeof Shield> = {
  super_admin: Shield,
  teacher: GraduationCap,
  student: BookOpen,
  parent: User,
  finance_manager: Shield,
  qirat_manager: Shield,
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  finance_manager: "Finance Manager",
  qirat_manager: "Qirat Manager",
};

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  userRole,
}: LogoutConfirmDialogProps) {
  const [name, setName] = useState(userName || "");
  const [role, setRole] = useState(userRole || "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(userName || localStorage.getItem("userName") || "User");
      setRole(userRole || localStorage.getItem("userRole") || "");
    }
  }, [userName, userRole, open]);

  const RoleIcon = roleIcons[role] || User;
  const roleLabel = roleLabels[role] || role;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md"
          >
            {/* Ambient glow orbs */}
            <div className="absolute -top-20 -right-20 size-40 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 size-40 rounded-full bg-nejah-electric/10 blur-3xl pointer-events-none" />

            <div
              className={cn(
                "relative overflow-hidden rounded-3xl border p-0",
                "border-red-500/20 dark:border-red-500/20",
                "bg-white/90 dark:bg-nejah-surface/95 backdrop-blur-2xl",
                "shadow-[0_0_60px_rgba(239,68,68,0.15)] dark:shadow-[0_0_60px_rgba(239,68,68,0.1)]",
              )}
            >
              {/* Top accent line */}
              <div className="h-1 w-full bg-gradient-to-r from-red-500 via-red-400 to-red-500" />

              <div className="p-6 sm:p-8 space-y-6">
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="size-4" />
                </button>

                {/* Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse" />
                    <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5">
                      <LogOut className="size-7 text-red-500" />
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-foreground">Confirm Logout</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    You are about to end your current session. Any unsaved changes will be lost.
                  </p>
                </div>

                {/* User info card */}
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 ring-2 ring-nejah-electric/20">
                    <span className="text-sm font-bold text-nejah-electric">{initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RoleIcon className="size-3.5 text-nejah-electric" />
                      <span className="text-xs font-semibold text-nejah-electric uppercase tracking-wide">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-yellow-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Active session will end</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You will need to sign in again to access your account.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex-1 h-11 rounded-2xl text-sm font-semibold transition-all duration-200",
                      "border border-border text-foreground",
                      "hover:bg-muted/50 active:scale-[0.98]",
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className={cn(
                      "flex-1 h-11 rounded-2xl text-sm font-semibold text-white transition-all duration-200",
                      "bg-gradient-to-r from-red-600 to-red-500",
                      "hover:from-red-500 hover:to-red-400",
                      "active:scale-[0.98]",
                      "shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]",
                      "flex items-center justify-center gap-2",
                    )}
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
