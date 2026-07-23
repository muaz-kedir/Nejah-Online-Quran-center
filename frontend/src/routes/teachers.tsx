import { memo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teachers')({
  beforeLoad: () => requireAuth(['super_admin', 'qirat_manager']),
});

const getStatusBadge = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'active':
      return 'bg-primary/10 text-primary dark:bg-nejah-sapphire/40 text-nejah-electric border border-primary/50 dark:border-nejah-border-blue/30';
    case 'inactive':
      return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50 dark:border-red-900/30';
    case 'pending':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-red-900/30';
    case 'on leave':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
    default:
      return 'bg-muted text-foreground dark:bg-nejah-surface dark:text-muted-foreground';
  }
};

const TeacherRow = memo(function TeacherRow({ teacher, onView, onEdit, onDelete }: {
  teacher: any;
  onView: (t: any) => void;
  onEdit: (t: any) => void;
  onDelete: (t: any) => void;
}) {
  return (
    <tr
      onClick={() => onView(teacher)}
      className="hover:bg-muted/50 dark:hover:bg-nejah-surface/30 transition-colors group cursor-pointer"
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 dark:from-nejah-surface dark:to-nejah-surface flex-shrink-0 flex items-center justify-center font-bold text-lg text-nejah-electric">
            {teacher.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-extrabold text-foreground group-hover:text-primary transition-colors text-base font-serif">
              {teacher.fullName}
            </p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">
              {teacher.specialization || 'General Islamic Studies'}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground dark:text-muted-foreground">
            {teacher.students?.length || 0} Students
          </span>
          <div className="w-16 bg-muted dark:bg-nejah-surface h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${Math.min((teacher.students?.length || 0) * 10, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <p className="text-sm font-bold text-foreground dark:text-muted-foreground">
          {teacher.experience || 0} Years
        </p>
      </td>
      <td className="py-4 px-4">
        <Badge className={cn('text-[10px] font-extrabold uppercase tracking-widest rounded-full px-3 py-1 border-none flex items-center w-max gap-1.5', getStatusBadge(teacher.status))}>
          <span className={cn('w-1.5 h-1.5 rounded-full', teacher.status === 'active' ? 'bg-primary/100' : 'bg-nejah-slate-blue')} />
          {teacher.status || 'Active'}
        </Badge>
      </td>
      <td className="py-4 px-6 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onView(teacher); }}
            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title="View Teacher Profile"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(teacher); }}
            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
            title="Edit Profile"
          >
            <Pencil className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(teacher); }}
            className="p-2 hover:bg-muted dark:hover:bg-nejah-surface rounded-lg text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
            title="Delete Teacher"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const COMPLAINT_REASONS = [
  'Performance Issue',
  'Unprofessional Behavior',
  'Attendance Problem',
  'Student Complaint',
  'Policy Violation',
  'Other',
];

function TeacherDetailModal({ teacher, onClose, userRole, onEdit, onRefresh }: {
  teacher: any | null;
  onClose: () => void;
  userRole: string;
  onEdit?: (t: any) => void;
  onRefresh?: () => void;
}) {
  const [details, setDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const printRef = useRef<HTMLDivElement>(null);

  const [complaints, setComplaints] = useState<any[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintReason, setComplaintReason] = useState(COMPLAINT_REASONS[0]);
  const [complaintDetails, setComplaintDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suspending, setSuspending] = useState(false);

  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    if (!teacher) { setDetails(null); return; }
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(apiUrl(`/teachers/${teacher.id}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setDetails(data))
      .catch(() => toast.error('Failed to load teacher details'))
      .finally(() => setLoading(false));
  }, [teacher]);

  const fetchComplaints = useCallback(async () => {
    if (!teacher) return;
    setComplaintsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(apiUrl(`/teachers/${teacher.id}/complaints`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setComplaints(await r.json());
    } catch { /* ignore */ }
    finally { setComplaintsLoading(false); }
  }, [teacher]);

  useEffect(() => {
    if (teacher && activeTab === 'complaints') fetchComplaints();
  }, [teacher, activeTab, fetchComplaints]);

  const handleSubmitComplaint = async () => {
    if (!complaintReason.trim() || !complaintDetails.trim()) {
      toast.error('Please fill in both reason and details');
      return;
    }
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(apiUrl(`/teachers/${teacher!.id}/complaints`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: complaintReason, details: complaintDetails }),
      });
      if (r.ok) {
        toast.success('Complaint submitted successfully');
        setShowComplaintForm(false);
        setComplaintReason(COMPLAINT_REASONS[0]);
        setComplaintDetails('');
        fetchComplaints();
      } else {
        toast.error('Failed to submit complaint');
      }
    } catch { toast.error('Failed to submit complaint'); }
    finally { setSubmitting(false); }
  };

  const handleResolveComplaint = async (complaintId: string, status: 'resolved' | 'dismissed') => {
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(apiUrl(`/teachers/${teacher!.id}/complaints/${complaintId}/resolve?status=${status}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resolutionNotes: `Marked as ${status} by admin` }),
      });
      if (r.ok) {
        toast.success(`Complaint ${status} successfully`);
        fetchComplaints();
      } else {
        toast.error('Failed to update complaint');
      }
    } catch { toast.error('Failed to update complaint'); }
  };

  const handleSuspendToggle = async () => {
    if (!details) return;
    const newStatus = details.status === 'active' ? 'inactive' : 'active';
    setSuspending(true);
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(apiUrl(`/teachers/${details.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (r.ok) {
        toast.success(`Teacher ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
        setDetails((prev: any) => ({ ...prev, status: newStatus }));
        if (onRefresh) onRefresh();
      } else {
        toast.error('Failed to update teacher status');
      }
    } catch { toast.error('Failed to update teacher status'); }
    finally { setSuspending(false); }
  };

  const handleDownloadPDF = () => {
    const w = window.open('', '_blank');
    if (!w || !details) return;
    const students = details.students || [];
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${details.fullName} - Teacher Report</title>
      <style>
        body { font-family: 'DejaVu Sans', Arial, sans-serif; padding: 40px; color: #1a1a2e; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
        .section { margin-bottom: 24px; }
        .section h2 { font-size: 16px; border-bottom: 2px solid #0F62AC; padding-bottom: 6px; margin-bottom: 12px; color: #0F62AC; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
        .label { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .value { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f5f7fa; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .badge-active { background: #e6f7e6; color: #2e7d32; }
        .badge-inactive { background: #fde8e8; color: #c62828; }
        .badge-pending { background: #e3f2fd; color: #1565c0; }
        .stats-row { display: flex; gap: 24px; margin-bottom: 16px; }
        .stat-card { background: #f5f7fa; border-radius: 8px; padding: 16px; flex: 1; text-align: center; }
        .stat-card .num { font-size: 28px; font-weight: 700; color: #0F62AC; }
        .stat-card .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-top: 4px; }
      </style></head><body>
      <h1>${details.fullName}</h1>
      <p class="subtitle">${details.specialization || 'General Islamic Studies'} &bull; ${details.status || 'Active'}</p>
      <div class="stats-row">
        <div class="stat-card"><div class="num">${students.length}</div><div class="lbl">Total Students</div></div>
        <div class="stat-card"><div class="num">${details.experience || 0}</div><div class="lbl">Years Exp.</div></div>
        <div class="stat-card"><div class="num">${details.monthlySalary || '—'}</div><div class="lbl">Salary</div></div>
      </div>
      <div class="section">
        <h2>Personal Information</h2>
        <div class="grid">
          <div><div class="label">Email</div><div class="value">${details.email || '—'}</div></div>
          <div><div class="label">Phone</div><div class="value">${details.phoneNumber || '—'}</div></div>
          <div><div class="label">Gender</div><div class="value">${details.gender || '—'}</div></div>
          <div><div class="label">Nationality</div><div class="value">${details.nationality || '—'}</div></div>
          <div><div class="label">Languages</div><div class="value">${details.languages ? details.languages.join(', ') : '—'}</div></div>
          <div><div class="label">Specialization</div><div class="value">${details.specialization || '—'}</div></div>
        </div>
      </div>
      <div class="section">
        <h2>Assigned Students (${students.length})</h2>
        ${students.length > 0 ? `<table><thead><tr><th>Name</th><th>Level</th><th>Status</th></tr></thead><tbody>${students.map((s: any) => `<tr><td>${s.fullName}</td><td>${s.level || '—'}</td><td>${s.status || 'Active'}</td></tr>`).join('')}</tbody></table>` : '<p>No students assigned.</p>'}
      </div>
      <p style="margin-top:32px;font-size:11px;color:#999;text-align:center;">Generated on ${new Date().toLocaleDateString()} &bull; Nejah Online Quran Center</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <Dialog open={!!teacher} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[900px] dark:bg-nejah-surface dark:border-nejah-border-blue max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-foreground">Teacher Details</DialogTitle>
            {details && isSuperAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(details)}
                  className="gap-1.5 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  type="button"
                  variant={details.status === 'active' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={handleSuspendToggle}
                  disabled={suspending}
                  className="gap-1.5 text-xs"
                >
                  {suspending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : details.status === 'active' ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  {details.status === 'active' ? 'Suspend' : 'Activate'}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-nejah-electric" /></div>
        ) : details ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-5 pt-4">
              <div ref={printRef} className="space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-nejah-sapphire to-nejah-electric flex items-center justify-center text-white font-bold text-xl">
                      {details.fullName?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{details.fullName}</h2>
                      <p className="text-sm text-muted-foreground">{details.specialization || 'General Islamic Studies'} &bull; {details.email}</p>
                    </div>
                  </div>
                  <Badge className={cn('text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1', getStatusBadge(details.status))}>
                    {details.status || 'Active'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-primary/5 dark:bg-nejah-sapphire/20 p-4 text-center">
                    <p className="text-2xl font-bold text-nejah-electric">{(details.students || []).length}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Students</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{details.experience || 0}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Years Exp.</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{details.monthlySalary || '—'}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Salary</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Email</span></div>
                    <p className="text-sm font-medium text-foreground">{details.email || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Phone</span></div>
                    <p className="text-sm font-medium text-foreground">{details.phoneNumber || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Gender</span></div>
                    <p className="text-sm font-medium text-foreground">{details.gender || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Country</span></div>
                    <p className="text-sm font-medium text-foreground">{details.country || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Languages</span></div>
                    <p className="text-sm font-medium text-foreground">{details.languages ? (Array.isArray(details.languages) ? details.languages.join(', ') : details.languages) : '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><Star className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Specialization</span></div>
                    <p className="text-sm font-medium text-foreground">{details.specialization || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">City</span></div>
                    <p className="text-sm font-medium text-foreground">{details.city || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Address</span></div>
                    <p className="text-sm font-medium text-foreground">{details.streetAddress || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><BookOpen className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Qirat Education</span></div>
                    <p className="text-sm font-medium text-foreground">{details.qiratEducationLevel || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground"><Award className="h-4 w-4" /><span className="text-[10px] font-semibold uppercase tracking-widest">Islamic Education</span></div>
                    <p className="text-sm font-medium text-foreground">{details.islamicEducationLevel || '—'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-nejah-electric" />
                    Assigned Students ({(details.students || []).length})
                  </h3>
                  {(details.students || []).length > 0 ? (
                    <div className="border border-border dark:border-nejah-border-blue rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted dark:bg-nejah-surface">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Name</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Level</th>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-nejah-border-blue">
                          {(details.students || []).map((s: any) => (
                            <tr key={s.id} className="hover:bg-muted/50 dark:hover:bg-nejah-surface/30">
                              <td className="px-3 py-2 font-medium text-foreground">{s.fullName}</td>
                              <td className="px-3 py-2 text-muted-foreground">{s.level || '—'}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1 text-xs">
                                  <span className={cn('w-1.5 h-1.5 rounded-full', s.status === 'active' ? 'bg-green-500' : 'bg-gray-400')} />
                                  {s.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No students assigned.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-5 pt-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-nejah-electric" />
                Teacher Performance Analysis
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-nejah-sapphire/30 dark:to-nejah-sapphire/10 p-5 text-center border border-primary/20 dark:border-nejah-border-blue/30">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-nejah-electric" />
                  <p className="text-3xl font-bold text-foreground">{details.todayClasses ?? '—'}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Today's Classes</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-950/10 p-5 text-center border border-blue-200/50 dark:border-blue-900/30">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-3xl font-bold text-foreground">{details.weeklyClasses ?? '—'}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Weekly Classes</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-950/10 p-5 text-center border border-amber-200/50 dark:border-amber-900/30">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-3xl font-bold text-foreground">{details.monthlyClasses ?? '—'}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">Monthly Classes</p>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 dark:bg-nejah-surface/50 p-5 border border-border dark:border-nejah-border-blue">
                <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-nejah-electric" />
                  Schedule Breakdown
                </h4>
                {(details.schedules || []).length > 0 ? (
                  <div className="space-y-2">
                    {(details.schedules || []).filter((s: any) => s.status === 'active').map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background dark:bg-nejah-surface/80">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.className}</p>
                          <p className="text-xs text-muted-foreground">{s.dayOfWeek} &bull; {s.startTimeString || '—'}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {s.classType || 'Regular'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active schedules found.</p>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Total Students: <span className="font-bold text-foreground">{(details.students || []).length}</span>
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={handleDownloadPDF} className="gap-2">
                  <Download className="h-4 w-4" /> Download PDF Report
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="complaints" className="space-y-5 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Flag className="h-5 w-5 text-nejah-electric" />
                  Complaints & Reports
                </h3>
                {!isSuperAdmin && (
                  <Button type="button" size="sm" onClick={() => setShowComplaintForm(!showComplaintForm)} className="gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    {showComplaintForm ? 'Cancel' : 'Submit Complaint'}
                  </Button>
                )}
              </div>

              {showComplaintForm && !isSuperAdmin && (
                <div className="rounded-xl border border-border dark:border-nejah-border-blue p-4 space-y-3 bg-muted/30 dark:bg-nejah-surface/30">
                  <h4 className="text-sm font-semibold text-foreground">New Complaint</h4>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Reason</Label>
                    <Select value={complaintReason} onValueChange={setComplaintReason}>
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLAINT_REASONS.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Details</Label>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      value={complaintDetails}
                      onChange={(e) => setComplaintDetails(e.target.value)}
                      className="min-h-[100px] rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={handleSubmitComplaint} disabled={submitting} className="gap-1.5">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Submit
                    </Button>
                  </div>
                </div>
              )}

              {complaintsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-nejah-electric" /></div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No complaints filed</p>
                  <p className="text-xs mt-1">All clear for this teacher.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((c: any) => (
                    <div key={c.id} className="rounded-xl border border-border dark:border-nejah-border-blue p-4 bg-muted/20 dark:bg-nejah-surface/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            'text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5',
                            c.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                            c.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400' :
                            'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                          )}>
                            {c.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        {isSuperAdmin && c.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleResolveComplaint(c.id, 'resolved')}
                              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-950/30 rounded-lg text-green-600 cursor-pointer"
                              title="Resolve"
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleResolveComplaint(c.id, 'dismissed')}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg text-red-600 cursor-pointer"
                              title="Dismiss"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{c.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.details}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>Submitted by: {c.submittedBy?.name || c.submittedById || 'Unknown'}</span>
                        {c.resolvedBy && <span>Resolved by: {c.resolvedBy?.name || c.resolvedById}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-center py-8 text-muted-foreground">Failed to load teacher details.</p>
        )}

        {!loading && details && (
          <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-nejah-border-blue mt-4">
            <Button type="button" onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TeachersPage() {
  const userRole = typeof localStorage !== 'undefined' ? localStorage.getItem('role') || '' : '';
  const [teachers, setTeachers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    pending: 0,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<any | null>(null);

  const fetchTeachers = useCallback(async (pageOverride?: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const page = pageOverride ?? meta.page;
      let url = apiUrl(`/teachers?page=${page}&limit=${meta.limit}`);
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status !== 'all') url += `&status=${encodeURIComponent(status)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await response.json();
      if (res && Array.isArray(res.data)) {
        setTeachers(res.data);
        setMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } else {
        setTeachers([]);
        setMeta({ total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (error) {
      toast.error('Failed to fetch faculty directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [meta.page, meta.limit, search, status]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/teachers/stats`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.total || 0,
          active: data.active || 0,
          onLeave: data.onLeave || 0,
          pending: data.pending || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeachers();
    fetchStats();
  }, [fetchTeachers, fetchStats]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta(prev => ({ ...prev, page: 1 }));
    fetchTeachers(1);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setMeta(prev => ({ ...prev, page: 1 }));
  };

  const navigate = useNavigate();
  const handleViewTeacher = useCallback((teacher: any) => {
    navigate({ to: '/teachers/$id/profile', params: { id: teacher.id } });
  }, [navigate]);
  const handleEditTeacher = useCallback((teacher: any) => setEditingTeacher(teacher), []);
  const handleDeleteTeacher = useCallback((teacher: any) => setDeletingTeacher(teacher), []);

  return (
    <DashboardLayout>
      <AmbientSection className="admin-page">
        <PageHeader
          eyebrow="Academic Faculty"
          title="Teachers"
          actions={
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" className="h-11 gap-2 rounded-xl px-4" disabled={refreshing}>
                <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} className="h-11 gap-2 rounded-xl px-6">
                <Plus className="h-5 w-5" />
                Add Teacher
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <BentoStatCard label="Total Faculty" value={stats?.total ?? 0} icon={<Calendar className="h-5 w-5" />} />
          <BentoStatCard label="Active Now" value={stats?.active ?? 0} icon={<Sparkles className="h-5 w-5" />} highlight />
          <BentoStatCard label="On Leave" value={String(stats?.onLeave ?? 0).padStart(2, '0')} icon={<RotateCcw className="h-5 w-5" />} />
          <BentoStatCard label="Pending" value={stats?.pending ?? 0} icon={<BookOpen className="h-5 w-5" />} />
        </div>

        <div className="admin-filter-bar">
          <div className="flex-1 min-w-[240px]">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search faculty by name, email, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 rounded-xl border-none pl-9"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="admin-field-label">Status</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 w-[140px] rounded-xl border-white/10 bg-background/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => fetchTeachers(1)} className="mt-5 h-11 rounded-xl px-6 font-bold">
              Apply Filter
            </Button>

            <Button variant="ghost" onClick={resetFilters} className="mt-5 h-11 w-11 rounded-xl p-0">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <GlassPanel className="overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-background/50">
                  <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Teacher Name</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Students Count</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Experience</th>
                  <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="h-24" />
                    </tr>
                  ))
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-muted-foreground font-medium font-serif">
                      No teachers found matching your search.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <TeacherRow key={teacher.id} teacher={teacher} onView={handleViewTeacher} onEdit={handleEditTeacher} onDelete={handleDeleteTeacher} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border dark:border-nejah-border-blue bg-muted/50 dark:bg-nejah-surface/50 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Showing <span className="text-foreground dark:text-foreground">{(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-foreground dark:text-foreground">{meta.total}</span> registered teachers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={meta.page === 1}
                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                className="h-9 w-9 rounded-xl dark:border-nejah-border-blue"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: meta.totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={meta.page === i + 1 ? 'default' : 'outline'}
                  onClick={() => setMeta({ ...meta, page: i + 1 })}
                  className={cn(
                    'h-9 w-9 rounded-xl font-bold border-none',
                    meta.page === i + 1 ? 'bg-primary hover:bg-nejah-azure' : 'bg-transparent text-muted-foreground hover:text-foreground dark:hover:text-nejah-electric'
                  )}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                disabled={meta.page === meta.totalPages}
                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                className="h-9 w-9 rounded-xl dark:border-nejah-border-blue"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassPanel>

        <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-3">
          <GlassPanel
            glow
            className="flex min-h-[160px] flex-col justify-between p-7 lg:col-span-2"
          >
            <div>
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-widest text-nejah-electric">
                Internal Announcement
              </p>
              <h2 className="max-w-[450px] text-2xl font-medium leading-tight tracking-tight text-foreground">
                New Faculty Training Program Begins Next Monday.
              </h2>
            </div>
            <p className="mt-4 max-w-[500px] text-xs leading-relaxed text-muted-foreground">
              Join our monthly pedagogy workshop to enhance student engagement and master virtual whiteboard curriculum delivery.
            </p>
          </GlassPanel>

          <GlassPanel className="flex flex-col justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">Scholarly Excellence</h3>
                <p className="text-xs font-medium text-muted-foreground">Faculty Accreditation</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              View teachers who have successfully completed the advanced virtual ijazah syllabus and curriculum accreditation this quarter.
            </p>
            <button className="mt-4 flex items-center gap-1.5 text-xs font-bold text-nejah-electric group hover:text-nejah-electric/80 cursor-pointer">
              View Rankings <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </GlassPanel>
        </div>
      </AmbientSection>

      <AddTeacherModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTeachers}
      />

      <EditTeacherModal
        open={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        onSuccess={fetchTeachers}
        teacher={editingTeacher}
      />

      <DeleteTeacherModal
        open={!!deletingTeacher}
        onClose={() => setDeletingTeacher(null)}
        onSuccess={fetchTeachers}
        teacherId={deletingTeacher?.id}
        teacherName={deletingTeacher?.fullName}
      />

      <TeacherDetailModal
        teacher={null}
        onClose={() => {}}
        userRole={userRole}
        onEdit={handleEditTeacher}
        onRefresh={fetchTeachers}
      />
    </DashboardLayout>
  );
}
