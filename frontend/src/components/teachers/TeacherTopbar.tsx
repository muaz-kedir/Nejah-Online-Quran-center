import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Bell, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { API_BASE, apiHeaders } from "@/lib/api";

interface TeacherTopbarProps {
  teacher?: { name?: string; fullName?: string; avatarUrl?: string; avatar?: string } | null;
}

interface SearchResult {
  id: string;
  name?: string;
  initials?: string;
  currentSurah?: string;
  email?: string;
}

export function TeacherTopbar({ teacher }: TeacherTopbarProps) {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowResults(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setShowResults(true);
    try {
      const res = await fetch(`${API_BASE}/teacher/dashboard/search?q=${encodeURIComponent(q)}`, {
        headers: apiHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || data.students || []);
      }
    } catch {
      console.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="h-20 hidden lg:flex items-center justify-between px-10 bg-card dark:bg-nejah-surface border-b border-border dark:border-white/5 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg lg:hidden">
          <LayoutDashboard className="h-5 w-5 text-nejah-electric" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-serif hidden md:block">
          Teacher Suite
        </h2>
      </div>

      <div className="flex-1 max-w-xl mx-8" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-nejah-slate-blue" />
          <Input
            placeholder="Search students, resources, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-muted dark:bg-background border-none rounded-2xl h-12 w-full focus-visible:ring-nejah-electric text-sm"
          />
        </form>

        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card dark:bg-nejah-surface rounded-2xl border border-border dark:border-white/5 shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50">
            {searching ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No results found</div>
            ) : (
              <ul className="py-2">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery("");
                        setSearchResults([]);
                        navigate({
                          to: "/teacher_students/$studentId",
                          params: { studentId: result.id },
                          search: {},
                        });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted dark:hover:bg-background transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted dark:bg-background flex items-center justify-center font-bold text-xs shrink-0">
                        {result.initials || (result.name || "?").charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{result.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {result.currentSurah || result.email || ""}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">
              {teacher?.name || teacher?.fullName || "Teacher"}
            </p>
            <p className="text-[10px] text-muted-foreground dark:text-nejah-slate-blue font-bold uppercase tracking-wider">
              Teacher
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-nejah-electric/15 p-0.5 bg-primary/10 flex items-center justify-center text-nejah-sapphire font-bold">
            {teacher?.avatarUrl || teacher?.avatar ? (
              <img
                src={teacher!.avatarUrl || teacher!.avatar!}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{(teacher?.name || "T").charAt(0)}</span>
            )}
          </div>
        </div>
        <div className="w-px h-8 bg-muted dark:bg-white/5" />
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: "/teacher_notifications" })}
            className="relative p-2 text-muted-foreground dark:text-nejah-slate-blue hover:text-nejah-electric transition-colors"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
          </button>
        </div>
      </div>
    </div>
  );
}
