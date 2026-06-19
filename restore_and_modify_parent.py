import os
import subprocess

# Run git checkout to restore parent_dashboard.tsx
print("Restoring parent_dashboard.tsx...")
subprocess.run(["git", "checkout", "--", "frontend/src/routes/parent_dashboard.tsx"], check=True)

# Read the file
file_path = "frontend/src/routes/parent_dashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Define the replacement for the top of the file
old_top_prefix = 'import { API_BASE, apiUrl } from "@/lib/api";'
# We will find the start of ChildCard to define what to replace
child_card_index = content.find("const ChildCard =")
if child_card_index == -1:
    raise ValueError("Could not find ChildCard")

# We want to replace everything from the imports up to the ChildCard with:
# 1. Core imports
# 2. StatCard component
# 3. ParentPortalLayout imports
new_top = """import { API_BASE, apiUrl } from "@/lib/api";
import { useState, useEffect } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ChevronRight, 
  BookOpen, 
  Users, 
  Clock, 
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  Mic,
  TrendingUp,
  Award,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { toast } from 'sonner';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { ParentPortalLayout, ParentPageLoader } from '@/components/parents/ParentPortalLayout';

// --- Stat Card Component ---
const StatCard = ({ icon: Icon, value, label, subValue, trend, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "glass-panel bg-white p-6 rounded-[32px] border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative",
      onClick ? "cursor-pointer hover:border-nejah-electric/20" : ""
    )}
  >
    <div className={cn("absolute top-0 right-0 w-20 h-20 opacity-[0.03] transform translate-x-6 -translate-y-6 rounded-full bg-nejah-surface")} />
    
    <div className="flex items-start justify-between mb-6">
      <div className={cn("p-3 rounded-2xl", 
        color === 'emerald' ? "bg-primary/10 text-nejah-electric" :
        color === 'blue' ? "bg-blue-50 text-blue-700" :
        color === 'amber' ? "bg-amber-50 text-amber-700" :
        color === 'red' ? "bg-red-50 text-red-700" : "bg-primary/10 text-nejah-electric"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      {trend && (
        <Badge variant="outline" className="rounded-full border-none px-2.5 py-0.5 bg-primary/10 text-nejah-electric font-black text-[9px] uppercase tracking-wider">
          {trend}
        </Badge>
      )}
    </div>
    
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
      <h3 className="text-3xl font-black text-foreground font-serif leading-none pt-2">{value}</h3>
      {subValue && <p className="text-[10px] text-muted-foreground mt-2 font-bold">{subValue}</p>}
      <div className="w-16 h-1 bg-muted rounded-full mt-3 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", 
          color === 'emerald' ? "bg-primary" :
          color === 'blue' ? "bg-blue-600" :
          color === 'amber' ? "bg-amber-600" :
          color === 'red' ? "bg-red-650" : "bg-nejah-sapphire"
        )} style={{ width: '70%' }} />
      </div>
    </div>
  </div>
);

// --- Topbar Component ---
const Topbar = ({ parent, onTabChange }: { parent: any; onTabChange: (tab: string) => void }) => {
  const { lang, setLang, translations } = useLanguage();
  
  return (
    <div className="h-24 hidden lg:flex items-center justify-between px-12 bg-card/80 backdrop-blur-md sticky top-0 z-20 w-full border-b border-border shadow-sm">
      <div className="flex items-center gap-6 w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-black text-nejah-sapphire font-serif">Parent Portal</h2>
          
          <div className="hidden lg:flex items-center bg-background/50 p-1.5 rounded-2xl border border-border ml-auto">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search curriculum, teachers..." 
                  className="pl-12 bg-transparent border-none w-80 h-10 text-xs focus-visible:ring-0"
                />
            </div>
          </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Language Switcher */}
        <div className="flex items-center gap-3 bg-background/50 px-4 py-2 rounded-2xl border border-border">
            {['English', 'Amharic', 'Oromo'].map((l) => (
                <button 
                    key={l}
                    onClick={() => setLang(l as any)}
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-widest transition-all px-2 py-0.5",
                        lang === l ? "text-nejah-sapphire underline underline-offset-4 decoration-2" : "text-muted-foreground hover:text-muted-foreground"
                    )}
                >
                    {l}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-3">
            <button className="relative p-2.5 bg-background/50 rounded-2xl text-muted-foreground hover:text-nejah-sapphire transition-all hover:shadow-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full animate-pulse" />
            </button>
            <button 
              onClick={() => onTabChange('messages')}
              className="relative p-2.5 bg-background/50 rounded-2xl text-muted-foreground hover:text-nejah-sapphire transition-all hover:shadow-sm"
            >
                <MessageSquare className="h-5 w-5" />
            </button>
        </div>

        <div className="w-px h-10 bg-muted" />

        <div 
          onClick={() => onTabChange('settings')}
          className="flex items-center gap-4 group cursor-pointer"
        >
          <div className="text-right">
             <p className="text-sm font-black text-nejah-sapphire leading-none group-hover:text-nejah-electric transition-colors">{parent?.name || 'Ahmed Al-Mansour'}</p>
             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Primary Guardian</p>
          </div>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-nejah-electric/10 shadow-md transform group-hover:scale-105 transition-transform bg-primary/10 flex items-center justify-center font-bold text-nejah-sapphire">
            {parent?.name?.charAt(0) || 'P'}
          </div>
        </div>
      </div>
    </div>
  );
};

"""

content = new_top + content[child_card_index:]

# Now replace the return statement wrapper in ParentDashboard
old_return_wrapper = """  return (
    <div className="flex min-h-screen bg-[#f8f9fb] text-foreground font-sans selection:bg-primary/15">
      {/* Sidebar navigation */}
      <ParentSidebar activeTab={activeTab} onTabChange={setActiveTab} isCollapsed={isCollapsed} />

      <div className={`flex-1 flex flex-col ${isCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        {/* Topbar */}
        <Topbar parent={data?.parent} onTabChange={setActiveTab} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <main className="p-12 space-y-12 w-full">"""

new_return_wrapper = """  return (
    <ParentPortalLayout
      activePath="/parent_dashboard"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      parent={data?.parent}
    >
      <Topbar parent={data?.parent} onTabChange={setActiveTab} />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 space-y-8 lg:space-y-12 w-full">"""

content = content.replace(old_return_wrapper, new_return_wrapper)

# Replace the closing wrapper in ParentDashboard
# The original has:
#         </main>
#       </div>
#     </div>
#   );
# }
old_closing = """        </main>
      </div>
    </div>
  );
}"""

new_closing = """        </main>
    </ParentPortalLayout>
  );
}"""

content = content.replace(old_closing, new_closing)

# Now edit ParentDashboardRoute and the createFileRoute to support search validation
old_route = """export const Route = createFileRoute('/parent_dashboard')({
  component: ParentDashboardRoute,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token) {
        throw redirect({ to: '/login' });
      }
      if (role !== 'parent') {
        throw redirect({ to: '/dashboard' });
      }
    }
  },
});

// Wrap component with LanguageProvider for translation support
function ParentDashboardRoute() {
  return (
    <LanguageProvider>
      <ParentDashboard />
    </LanguageProvider>
  );
}"""

new_route = """export const Route = createFileRoute('/parent_dashboard')({
  component: ParentDashboardRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || 'dashboard',
    };
  },
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token) {
        throw redirect({ to: '/login' });
      }
      if (role !== 'parent') {
        throw redirect({ to: '/dashboard' });
      }
    }
  },
});

// Wrap component with LanguageProvider for translation support
function ParentDashboardRoute() {
  const search = Route.useSearch();
  return (
    <LanguageProvider>
      <ParentDashboard initialTab={search.tab} />
    </LanguageProvider>
  );
}"""

content = content.replace(old_route, new_route)

# Now modify ParentDashboard function signature to accept initialTab
old_dashboard_fn = "function ParentDashboard() {"
new_dashboard_fn = """function ParentDashboard({ initialTab }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);"""

# In the original file, it has:
# function ParentDashboard() {
#   const [data, setData] = useState<any>(null);
#   const [loading, setLoading] = useState(true);
#   const [activeTab, setActiveTab] = useState('dashboard');
# We want to replace this whole block:
old_state_block = """function ParentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');"""

new_state_block = """function ParentDashboard({ initialTab }: { initialTab?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);"""

content = content.replace(old_state_block, new_state_block)

# Save the file back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("parent_dashboard.tsx successfully restored and updated!")
