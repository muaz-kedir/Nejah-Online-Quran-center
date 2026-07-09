import { useState, useRef } from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TeacherNote } from "@/lib/teacher-types";

const NOTE_TYPES = ["Class Reminder", "Observation", "General Reminder"] as const;
type NoteType = (typeof NOTE_TYPES)[number];

interface NoteModalProps {
  note: Partial<TeacherNote> | null;
  onClose: () => void;
  onSave: (data: { title: string; content: string; type: string }) => void;
}

export function NoteModal({ note, onClose, onSave }: NoteModalProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [type, setType] = useState<NoteType>(note?.type || "General Reminder");
  const [saving, setSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    await onSave({ title, content, type });
    setSaving(false);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div className="bg-card dark:bg-nejah-surface rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border dark:border-white/5">
          <div>
            <h3 className="text-xl font-extrabold text-foreground font-serif">
              {note ? "Edit Note" : "Add Personal Reflection"}
            </h3>
            <p className="text-xs text-muted-foreground dark:text-nejah-slate-blue font-medium mt-0.5">
              Your notes are private and visible only to you
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground dark:text-nejah-slate-blue hover:bg-muted dark:hover:bg-background hover:text-muted-foreground dark:hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-widest">
              Note Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {NOTE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                    type === t
                      ? t === "Class Reminder"
                        ? "bg-primary border-nejah-electric text-white"
                        : t === "Observation"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-blue-500 border-blue-500 text-white"
                      : "border-border dark:border-white/10 text-muted-foreground dark:text-nejah-slate-blue hover:border-border dark:hover:border-white/20",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-widest">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Focus on Makharij with Sarah"
              className="w-full px-4 py-3 rounded-xl border border-border dark:border-white/10 text-sm font-semibold text-foreground placeholder:text-muted-foreground dark:placeholder:text-nejah-slate-blue/50 focus:outline-none focus:ring-2 focus:ring-nejah-electric focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-widest">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note or observation here..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border dark:border-white/10 text-sm font-medium text-muted-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-nejah-slate-blue/50 focus:outline-none focus:ring-2 focus:ring-nejah-electric focus:border-transparent transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-muted-foreground dark:text-nejah-slate-blue hover:bg-muted dark:hover:bg-background transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-nejah-surface text-white hover:bg-nejah-sapphire transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : note ? "Save Changes" : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
