import { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useApp } from '@/context/AppContext';
import { requireAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import {
  Download,
  Search,
  Calendar,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  FileText,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  RefreshCcw,
} from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'qirat_manager']),
});

const API = 'http://localhost:3000/api';
const CHART_COLORS = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d'];

const TRACK_LABELS: Record<string, string> = {
  qaidah: 'Qaidah Nooraniyah',
  quran_reading: 'Quran Reading',
  tajweed: 'Tajweed',
  hifz: 'Hifz',
  unknown: 'Other',
};

type ReportId =
  | 'student-performance'
  | 'teacher-activity'
  | 'attendance'
  | 'academic-progress'
  | 'registrations'
  | 'parent-activity'
  | 'homework'
  | 'exams'
  | 'teacher-replacements';

const REPORT_DEFS: {
  id: ReportId;
  title: string;
  description: string;
  icon: any;
  endpoint: string;
}[] = [
  { id: 'student-performance', title: 'Student Performance', description: 'Attendance, homework and academic progress per student', icon: BookOpen, endpoint: '/reports/students/performance' },
  { id: 'teacher-activity', title: 'Teacher Activity', description: 'Classes conducted, hours taught and teacher attendance', icon: Users, endpoint: '/reports/teachers/activity' },
  { id: 'attendance', title: 'Attendance Analytics', description: 'Present, late and absent trends across sessions', icon: Clock, endpoint: '/reports/attendance/analytics' },
  { id: 'academic-progress', title: 'Academic Progress', description: 'Progress per learning track and learning path analytics', icon: TrendingUp, endpoint: '/reports/progress/analytics' },
  { id: 'registrations', title: 'Student Registration', description: 'New registrations by date, country and program', icon: Calendar, endpoint: '/reports/registrations' },
  { id: 'parent-activity', title: 'Parent Activity', description: 'Parent engagement and notifications', icon: Mail, endpoint: '/reports/parents/activity' },
  { id: 'homework', title: 'Homework', description: 'Assigned, pending and completed homework', icon: FileText, endpoint: '/reports/homework' },
  { id: 'exams', title: 'Exams & Evaluations', description: 'Scores, pass rate and exam distribution', icon: CheckCircle, endpoint: '/reports/exams' },
  { id: 'teacher-replacements', title: 'Teacher Replacement', description: 'Replacement assignments and their statuses', icon: AlertCircle, endpoint: '/reports/teacher-replacements' },
];

interface SummaryData {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalParents: number;
  totalTeachers: number;
  activeTeachers: number;
  activeClasses: number;
  attendanceRate: number;
  homeworkCompletionRate: number;
  averageAcademicProgress: number;
  newStudentsThisMonth: number;
}

interface FilterState {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  studentStatus: 'all' | 'active' | 'inactive';
  country: string;
  teacherId: string;
  learningProgram: 'all' | 'qaidah' | 'quran_reading' | 'tajweed' | 'hifz';
  customStartDate: string;
  customEndDate: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

function buildDateRange(filters: FilterState): { startDate?: string; endDate?: string } {
  const now = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  switch (filters.dateRange) {
    case 'today':
      return { startDate: fmt(now), endDate: fmt(now) };
    case 'week':
      return { startDate: fmt(startOfWeek(now, { weekStartsOn: 1 })), endDate: fmt(now) };
    case 'month':
      return { startDate: fmt(startOfMonth(now)), endDate: fmt(now) };
    case 'quarter':
      return { startDate: fmt(startOfQuarter(now)), endDate: fmt(now) };
    case 'year':
      return { startDate: fmt(startOfYear(now)), endDate: fmt(now) };
    case 'custom': {
      const range: { startDate?: string; endDate?: string } = {};
      if (filters.customStartDate) range.startDate = filters.customStartDate;
      if (filters.customEndDate) range.endDate = filters.customEndDate;
      return range;
    }
    default:
      return {};
  }
}

function buildReportParams(
  reportId: ReportId,
  filters: FilterState,
  extras: { page?: number; search?: string } = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const { startDate, endDate } = buildDateRange(filters);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const program = filters.learningProgram !== 'all' ? filters.learningProgram : '';

  switch (reportId) {
    case 'student-performance':
      if (filters.studentStatus !== 'all') params.set('status', filters.studentStatus);
      if (filters.teacherId) params.set('teacherId', filters.teacherId);
      if (filters.country) params.set('country', filters.country);
      if (program) params.set('learningProgram', program);
      if (extras.search) params.set('search', extras.search);
      params.set('page', String(extras.page || 1));
      params.set('limit', '10');
      break;
    case 'teacher-activity':
      if (filters.country) params.set('country', filters.country);
      params.set('page', String(extras.page || 1));
      params.set('limit', '10');
      break;
    case 'attendance':
      if (filters.teacherId) params.set('teacherId', filters.teacherId);
      break;
    case 'academic-progress':
      if (program) params.set('learningProgram', program);
      break;
    case 'registrations':
      if (filters.country) params.set('country', filters.country);
      break;
    case 'parent-activity':
      if (filters.country) params.set('country', filters.country);
      break;
    case 'exams':
      if (program) params.set('learningTrack', program);
      break;
    default:
      break;
  }
  return params;
}

function trackLabel(track: string): string {
  return TRACK_LABELS[track] || track;
}

// CSV (Excel-compatible) download
function downloadCSV(filename: string, sections: { title: string; rows: Record<string, any>[] }[]) {
  const escape = (value: any) => {
    const str = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const lines: string[] = [];
  for (const section of sections) {
    if (!section.rows.length) continue;
    lines.push(escape(section.title));
    const headers = Object.keys(section.rows[0]);
    lines.push(headers.map(escape).join(','));
    for (const row of section.rows) {
      lines.push(headers.map((h) => escape(row[h])).join(','));
    }
    lines.push('');
  }

  if (!lines.length) {
    toast.error('No data available to export.');
    return;
  }

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// PDF export via printable window
function exportPDF(title: string, sections: { title: string; rows: Record<string, any>[] }[]) {
  const hasData = sections.some((s) => s.rows.length > 0);
  if (!hasData) {
    toast.error('No data available to export.');
    return;
  }

  const tableHtml = sections
    .filter((s) => s.rows.length > 0)
    .map((section) => {
      const headers = Object.keys(section.rows[0]);
      return `
        <h2>${section.title}</h2>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${section.rows
              .map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`)
              .join('')}
          </tbody>
        </table>`;
    })
    .join('');

  const win = window.open('', '_blank');
  if (!win) {
    toast.error('Pop-up blocked. Please allow pop-ups to export PDF.');
    return;
  }
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; border-bottom: 2px solid #059669; padding-bottom: 8px; }
          h2 { font-size: 15px; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
          th { background: #f0fdf4; }
          .meta { color: #666; font-size: 11px; }
        </style>
      </head>
      <body>
        <h1>Nejah Online Quran &amp; Islamic Center — ${title}</h1>
        <p class="meta">Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
        ${tableHtml}
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  win.document.close();
}

function objectToRows(obj: Record<string, number> | undefined, keyName: string, valueName: string) {
  return Object.entries(obj || {}).map(([k, v]) => ({ [keyName]: k, [valueName]: v }));
}

// Flatten any report payload into exportable sections
function getExportSections(reportId: ReportId, data: any): { title: string; rows: Record<string, any>[] }[] {
  if (!data) return [];
  switch (reportId) {
    case 'student-performance':
      return [
        {
          title: 'Student Performance',
          rows: (data.data || []).map((r: any) => ({
            Student: r.studentName,
            'Student ID': r.studentId,
            Country: r.country,
            Level: r.level,
            Teacher: r.teacherName,
            'Attendance %': r.attendanceRate,
            'Homework %': r.homeworkCompletionRate,
            'Progress %': r.averageProgress,
            'Current Topic': r.currentTopic,
            Status: r.status,
          })),
        },
      ];
    case 'teacher-activity':
      return [
        {
          title: 'Teacher Activity',
          rows: (data.data || []).map((r: any) => ({
            Teacher: r.teacherName,
            Email: r.email,
            'Assigned Students': r.totalStudents,
            'Classes Conducted': r.totalClasses,
            'Hours Taught': r.totalHoursTaught,
            Present: r.presentCount,
            Late: r.lateCount,
            Missed: r.absentCount,
            'Attendance %': r.completionRate,
          })),
        },
      ];
    case 'attendance':
      return [
        {
          title: 'Attendance Summary',
          rows: [
            {
              'Total Sessions': data.totalSessions,
              'Students Assigned': data.totalStudentsAssigned,
              Present: data.totalPresent,
              Late: data.totalLate,
              Absent: data.totalAbsent,
              'Left Early': data.totalLeftEarly,
              'Attendance Rate %': data.overallAttendanceRate,
            },
          ],
        },
        { title: 'Sessions By Day', rows: objectToRows(data.sessionsByDay, 'Day', 'Sessions') },
      ];
    case 'academic-progress':
      return [
        {
          title: 'Academic Progress by Track',
          rows: (Array.isArray(data) ? data : []).map((r: any) => ({
            'Learning Track': trackLabel(r.learningTrack),
            Students: r.totalStudents,
            'Avg Progress %': r.avgProgressPercentage,
            'Completed Topics': r.completedTopics,
            'Total Topics': r.totalTopics,
          })),
        },
      ];
    case 'registrations':
      return [
        {
          title: 'Registrations by Date',
          rows: (Array.isArray(data) ? data : []).map((r: any) => ({
            Date: r.date,
            Registrations: r.totalRegistrations,
            'By Level': Object.entries(r.byLevel || {}).map(([k, v]) => `${k}: ${v}`).join('; '),
            'By Country': Object.entries(r.byCountry || {}).map(([k, v]) => `${k}: ${v}`).join('; '),
          })),
        },
      ];
    case 'parent-activity':
      return [
        {
          title: 'Parent Activity',
          rows: (Array.isArray(data) ? data : []).map((r: any) => ({
            Parent: r.parentName,
            Email: r.email,
            Children: r.totalStudents,
            'Notifications Received': r.notificationsReceived,
            'Last Active': r.lastActive ? format(new Date(r.lastActive), 'yyyy-MM-dd') : '—',
          })),
        },
      ];
    case 'homework':
      return [
        {
          title: 'Homework Summary',
          rows: [
            {
              'Total Assigned': data.totalHomework,
              Completed: data.completed,
              Pending: data.pending,
              'Avg Completion (days)': data.averageCompletionTime,
            },
          ],
        },
        { title: 'Homework by Difficulty', rows: objectToRows(data.byDifficulty, 'Difficulty', 'Count') },
        { title: 'Homework by Student', rows: objectToRows(data.byStudent, 'Student', 'Count') },
      ];
    case 'exams':
      return [
        {
          title: 'Exam Summary',
          rows: [
            {
              'Total Exams': data.totalExams,
              'Students Taken': data.totalStudentsTaken,
              'Average Score': data.averageScore,
              'Highest Score': data.highestScore,
              'Lowest Score': data.lowestScore,
              'Pass Rate %': data.passRate,
              'Fail Rate %': data.totalExams > 0 ? +(100 - data.passRate).toFixed(2) : 0,
            },
          ],
        },
        { title: 'Exams by Learning Track', rows: objectToRows(data.byLearningTrack, 'Track', 'Count') },
        { title: 'Exams by Difficulty', rows: objectToRows(data.byDifficulty, 'Difficulty', 'Count') },
      ];
    case 'teacher-replacements':
      return [
        {
          title: 'Teacher Replacements',
          rows: (data.details || []).map((r: any) => ({
            Student: r.studentName,
            'Original Teacher': r.originalTeacher,
            'Replacement Teacher': r.replacementTeacher,
            'Start Date': r.startDate,
            'End Date': r.endDate,
            Reason: r.reason,
            Status: r.status,
          })),
        },
        { title: 'Replacements by Reason', rows: objectToRows(data.byReason, 'Reason', 'Count') },
      ];
    default:
      return [];
  }
}

// ─── page ────────────────────────────────────────────────────────────────────

function ReportsContent() {
  const { t } = useApp();
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [exportingAll, setExportingAll] = useState(false);

  const [filterState, setFilterState] = useState<FilterState>({
    dateRange: 'all',
    studentStatus: 'all',
    country: '',
    teacherId: '',
    learningProgram: 'all',
    customStartDate: '',
    customEndDate: '',
  });

  // Report dialog state
  const [selectedReport, setSelectedReport] = useState<ReportId | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const selectedDef = REPORT_DEFS.find((d) => d.id === selectedReport) || null;

  // Fetch summary (re-runs when the date range changes)
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const { startDate, endDate } = buildDateRange(filterState);
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const res = await fetch(`${API}/reports/summary?${params.toString()}`, { headers: authHeaders() });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || `Failed to load summary (${res.status})`);
        }
        setSummaryData(await res.json());
      } catch (error: any) {
        console.error('Failed to load summary', error);
        setSummaryError(error.message || 'Failed to load summary statistics.');
        setSummaryData(null);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterState.dateRange, filterState.customStartDate, filterState.customEndDate]);

  // Fetch teachers for the filter dropdown
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch(`${API}/teachers`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setTeachers(list.map((te: any) => ({ id: te.id, fullName: te.fullName || te.name })));
        }
      } catch (error) {
        console.error('Failed to load teachers', error);
      }
    };
    fetchTeachers();
  }, []);

  // Debounce report search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Fetch selected report data
  useEffect(() => {
    if (!selectedReport || !selectedDef) return;
    const fetchReport = async () => {
      setReportLoading(true);
      setReportError(null);
      try {
        const params = buildReportParams(selectedReport, filterState, { page, search });
        const res = await fetch(`${API}${selectedDef.endpoint}?${params.toString()}`, { headers: authHeaders() });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || `Failed to load report (${res.status})`);
        }
        setReportData(await res.json());
      } catch (error: any) {
        console.error('Failed to load report', error);
        setReportError(error.message || 'Failed to load report data.');
        setReportData(null);
      } finally {
        setReportLoading(false);
      }
    };
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, filterState, page, search]);

  const openReport = (id: ReportId) => {
    setReportData(null);
    setPage(1);
    setSearchInput('');
    setSearch('');
    setSort(null);
    setSelectedReport(id);
  };

  const handleSort = (key: string) => {
    setSort((prev) =>
      prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    );
  };

  const sortRows = (rows: any[]) => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const an = parseFloat(av);
      const bn = parseFloat(bv);
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av ?? '').localeCompare(String(bv ?? ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!selectedReport || !selectedDef || !reportData) {
      toast.error('No report data to export yet.');
      return;
    }
    const sections = getExportSections(selectedReport, reportData);
    if (type === 'excel') {
      downloadCSV(`${selectedDef.title.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyyMMdd')}.csv`, sections);
      toast.success('Excel (CSV) export downloaded.');
    } else {
      exportPDF(selectedDef.title, sections);
    }
  };

  const handleExportAll = async (type: 'pdf' | 'excel') => {
    setExportingAll(true);
    try {
      const allSections: { title: string; rows: Record<string, any>[] }[] = [];
      for (const def of REPORT_DEFS) {
        const params = buildReportParams(def.id, filterState, { page: 1 });
        params.set('limit', '100');
        const res = await fetch(`${API}${def.endpoint}?${params.toString()}`, { headers: authHeaders() });
        if (!res.ok) continue;
        const data = await res.json();
        allSections.push(...getExportSections(def.id, data));
      }
      if (type === 'excel') {
        downloadCSV(`nejah-all-reports-${format(new Date(), 'yyyyMMdd')}.csv`, allSections);
        toast.success('Complete reporting package downloaded (Excel/CSV).');
      } else {
        exportPDF('Complete Reports Package', allSections);
      }
    } catch (error) {
      console.error('Export all failed', error);
      toast.error('Failed to export all reports.');
    } finally {
      setExportingAll(false);
    }
  };

  const summaryCards = summaryData
    ? [
        { label: 'Total Students', value: summaryData.totalStudents, sub: `+${summaryData.newStudentsThisMonth} this month`, icon: Users },
        { label: 'Active Students', value: summaryData.activeStudents, sub: summaryData.totalStudents > 0 ? `${((summaryData.activeStudents / summaryData.totalStudents) * 100).toFixed(1)}% of total` : '—', icon: CheckCircle },
        { label: 'Inactive Students', value: summaryData.inactiveStudents, sub: summaryData.totalStudents > 0 ? `${((summaryData.inactiveStudents / summaryData.totalStudents) * 100).toFixed(1)}% of total` : '—', icon: AlertCircle },
        { label: 'Total Teachers', value: summaryData.totalTeachers, sub: `${summaryData.activeTeachers} active`, icon: Users },
        { label: 'Active Classes', value: summaryData.activeClasses, sub: 'Active schedules', icon: BookOpen },
        { label: 'Attendance Rate', value: `${summaryData.attendanceRate}%`, sub: 'From real attendance records', icon: Clock },
        { label: 'Homework Completion', value: `${summaryData.homeworkCompletionRate}%`, sub: 'All assigned homework', icon: FileText },
        { label: 'Avg Academic Progress', value: `${summaryData.averageAcademicProgress}%`, sub: 'Across all learning tracks', icon: TrendingUp },
        { label: 'New This Month', value: summaryData.newStudentsThisMonth, sub: 'Since month start', icon: Calendar },
      ]
    : [];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.reports || 'Reports & Analytics'}</h1>
            <p className="text-muted-foreground">Real-time reporting and analytics center</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExportAll('pdf')} disabled={exportingAll}>
              {exportingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export All (PDF)
            </Button>
            <Button onClick={() => handleExportAll('excel')} disabled={exportingAll}>
              {exportingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export All (Excel)
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="h-28 animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-8 w-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : summaryError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{summaryError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterState((prev) => ({ ...prev }))}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>All reports and statistics update based on these filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Date Range</label>
                <Select
                  value={filterState.dateRange}
                  onValueChange={(value) => setFilterState((prev) => ({ ...prev, dateRange: value as FilterState['dateRange'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Student Status</label>
                <Select
                  value={filterState.studentStatus}
                  onValueChange={(value) => setFilterState((prev) => ({ ...prev, studentStatus: value as FilterState['studentStatus'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Country</label>
                <Input
                  placeholder="All countries"
                  value={filterState.country}
                  onChange={(e) => setFilterState((prev) => ({ ...prev, country: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Teacher</label>
                <Select
                  value={filterState.teacherId || 'all'}
                  onValueChange={(value) => setFilterState((prev) => ({ ...prev, teacherId: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Learning Program</label>
                <Select
                  value={filterState.learningProgram}
                  onValueChange={(value) => setFilterState((prev) => ({ ...prev, learningProgram: value as FilterState['learningProgram'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="qaidah">Qaidah Nooraniyah</SelectItem>
                    <SelectItem value="quran_reading">Quran Reading</SelectItem>
                    <SelectItem value="tajweed">Tajweed</SelectItem>
                    <SelectItem value="hifz">Hifz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filterState.dateRange === 'custom' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Start Date</label>
                  <Input
                    type="date"
                    value={filterState.customStartDate}
                    onChange={(e) => setFilterState((prev) => ({ ...prev, customStartDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">End Date</label>
                  <Input
                    type="date"
                    value={filterState.customEndDate}
                    onChange={(e) => setFilterState((prev) => ({ ...prev, customEndDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {REPORT_DEFS.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <card.icon className="h-5 w-5 text-primary" />
                  {card.title}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => openReport(card.id)}>
                  View Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Report Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDef?.title}</DialogTitle>
            <DialogDescription>{selectedDef?.description} — live data, filtered by the global filters.</DialogDescription>
          </DialogHeader>

          {reportLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-red-600">
              <AlertCircle className="h-8 w-8" />
              <p>{reportError}</p>
            </div>
          ) : reportData && selectedReport ? (
            <ReportDetail
              reportId={selectedReport}
              data={reportData}
              page={page}
              setPage={setPage}
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              sort={sort}
              onSort={handleSort}
              sortRows={sortRows}
            />
          ) : null}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('excel')} disabled={reportLoading || !reportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={() => handleExport('pdf')} disabled={reportLoading || !reportData}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportsPage() {
  return (
    <DashboardLayout>
      <ReportsContent />
    </DashboardLayout>
  );
}

// ─── report detail renderers ─────────────────────────────────────────────────

function StatGrid({ stats }: { stats: { label: string; value: any; tone?: 'good' | 'warn' | 'bad' }[] }) {
  const toneClass = (tone?: string) =>
    tone === 'good' ? 'text-primary' : tone === 'warn' ? 'text-amber-600' : tone === 'bad' ? 'text-red-600' : '';
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className={`text-xl font-bold ${toneClass(s.tone)}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  onSort,
}: {
  label: string;
  sortKey: string;
  onSort: (key: string) => void;
}) {
  return (
    <TableHead>
      <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => onSort(sortKey)}>
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

function PagerBar({
  meta,
  page,
  setPage,
}: {
  meta: { total: number; page: number; limit: number; totalPages: number } | undefined;
  page: number;
  setPage: (p: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted-foreground">
        Page {meta.page} of {meta.totalPages} ({meta.total} records)
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function ReportDetail({
  reportId,
  data,
  page,
  setPage,
  searchInput,
  setSearchInput,
  sort,
  onSort,
  sortRows,
}: {
  reportId: ReportId;
  data: any;
  page: number;
  setPage: (p: number) => void;
  searchInput: string;
  setSearchInput: (s: string) => void;
  sort: { key: string; dir: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  sortRows: (rows: any[]) => any[];
}) {
  switch (reportId) {
    case 'student-performance': {
      const rows = sortRows(data.data || []);
      const topPerformers = [...(data.data || [])].sort((a, b) => b.averageProgress - a.averageProgress).slice(0, 5);
      const needAttention = (data.data || []).filter((r: any) => r.attendanceRate < 60 || r.averageProgress < 30);
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Performing Students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {topPerformers.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
                {topPerformers.map((s: any) => (
                  <div key={s.studentId} className="flex justify-between text-sm">
                    <span>{s.studentName}</span>
                    <span className="font-medium text-primary">{s.averageProgress}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Students Needing Attention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {needAttention.length === 0 && <p className="text-sm text-muted-foreground">No students at risk on this page.</p>}
                {needAttention.slice(0, 5).map((s: any) => (
                  <div key={s.studentId} className="flex justify-between text-sm">
                    <span>{s.studentName}</span>
                    <span className="font-medium text-red-600">
                      {s.attendanceRate}% att / {s.averageProgress}% prog
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {rows.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="studentName" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="averageProgress" name="Progress %" fill={CHART_COLORS[0]} />
                  <Bar dataKey="attendanceRate" name="Attendance %" fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or email..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Student" sortKey="studentName" onSort={onSort} />
                  <TableHead>Country</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Teacher</TableHead>
                  <SortableHead label="Attendance %" sortKey="attendanceRate" onSort={onSort} />
                  <SortableHead label="Homework %" sortKey="homeworkCompletionRate" onSort={onSort} />
                  <SortableHead label="Progress %" sortKey="averageProgress" onSort={onSort} />
                  <TableHead>Current Topic</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No students match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row: any) => (
                    <TableRow key={row.studentId}>
                      <TableCell className="font-medium">
                        {row.studentName}
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </TableCell>
                      <TableCell>{row.country}</TableCell>
                      <TableCell>{row.level}</TableCell>
                      <TableCell>{row.teacherName}</TableCell>
                      <TableCell>{row.attendanceRate}%</TableCell>
                      <TableCell>{row.homeworkCompletionRate}%</TableCell>
                      <TableCell>{row.averageProgress}%</TableCell>
                      <TableCell className="max-w-[140px] truncate">{row.currentTopic}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PagerBar meta={data.meta} page={page} setPage={setPage} />
        </div>
      );
    }

    case 'teacher-activity': {
      const rows = sortRows(data.data || []);
      const ranked = [...(data.data || [])].sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate));
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Teacher Rankings (by attendance performance)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {ranked.slice(0, 5).map((te: any, i: number) => (
                <div key={te.teacherId} className="flex justify-between text-sm">
                  <span>
                    #{i + 1} {te.teacherName}
                  </span>
                  <span className="font-medium">{te.completionRate}% · {te.totalClasses} classes</span>
                </div>
              ))}
              {ranked.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
            </CardContent>
          </Card>

          {rows.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="teacherName" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="totalClasses" name="Classes Conducted" fill={CHART_COLORS[0]} />
                  <Bar dataKey="totalHoursTaught" name="Hours Taught" fill={CHART_COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Teacher" sortKey="teacherName" onSort={onSort} />
                  <SortableHead label="Students" sortKey="totalStudents" onSort={onSort} />
                  <SortableHead label="Classes" sortKey="totalClasses" onSort={onSort} />
                  <SortableHead label="Hours" sortKey="totalHoursTaught" onSort={onSort} />
                  <TableHead>Present</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Missed</TableHead>
                  <SortableHead label="Attendance %" sortKey="completionRate" onSort={onSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No teachers match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row: any) => (
                    <TableRow key={row.teacherId}>
                      <TableCell className="font-medium">
                        {row.teacherName}
                        <p className="text-xs text-muted-foreground">{row.email}</p>
                      </TableCell>
                      <TableCell>{row.totalStudents}</TableCell>
                      <TableCell>{row.totalClasses}</TableCell>
                      <TableCell>{row.totalHoursTaught}</TableCell>
                      <TableCell className="text-primary">{row.presentCount}</TableCell>
                      <TableCell className="text-amber-600">{row.lateCount}</TableCell>
                      <TableCell className="text-red-600">{row.absentCount}</TableCell>
                      <TableCell>{row.completionRate}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PagerBar meta={data.meta} page={page} setPage={setPage} />
        </div>
      );
    }

    case 'attendance': {
      const dayData = Object.entries(data.sessionsByDay || {}).map(([day, count]) => ({ day, sessions: count }));
      const statusData = Object.entries(data.attendanceByStatus || {})
        .map(([status, count]) => ({ name: status, value: count as number }))
        .filter((d) => d.value > 0);
      return (
        <div className="space-y-6">
          <StatGrid
            stats={[
              { label: 'Total Sessions', value: data.totalSessions },
              { label: 'Attendance Rate', value: `${data.overallAttendanceRate}%`, tone: 'good' },
              { label: 'Present', value: data.totalPresent, tone: 'good' },
              { label: 'Late', value: data.totalLate, tone: 'warn' },
              { label: 'Absent', value: data.totalAbsent, tone: 'bad' },
              { label: 'Left Early', value: data.totalLeftEarly, tone: 'warn' },
              { label: 'Students Assigned', value: data.totalStudentsAssigned },
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sessions by Day</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {dayData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip />
                      <Bar dataKey="sessions" fill={CHART_COLORS[1]} name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Attendance Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {statusData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance records in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={70} label>
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    case 'academic-progress': {
      const tracks = (Array.isArray(data) ? data : []).map((tr: any) => ({
        ...tr,
        label: trackLabel(tr.learningTrack),
      }));
      return (
        <div className="space-y-6">
          <StatGrid
            stats={tracks.map((tr: any) => ({
              label: tr.label,
              value: `${tr.totalStudents} students`,
            }))}
          />
          {tracks.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tracks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="avgProgressPercentage" name="Avg Progress %" fill={CHART_COLORS[0]} />
                  <Bar dataKey="totalStudents" name="Students" fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No progress records match the current filters.</p>
          )}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learning Track</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Avg Progress</TableHead>
                  <TableHead>Completed Topics</TableHead>
                  <TableHead>Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracks.map((tr: any) => (
                  <TableRow key={tr.learningTrack}>
                    <TableCell className="font-medium">{tr.label}</TableCell>
                    <TableCell>{tr.totalStudents}</TableCell>
                    <TableCell>{tr.avgProgressPercentage}%</TableCell>
                    <TableCell>{tr.completedTopics}</TableCell>
                    <TableCell>
                      {tr.totalTopics > 0 ? ((tr.completedTopics / tr.totalTopics) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    case 'registrations': {
      const rows = (Array.isArray(data) ? data : []).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
      const total = rows.reduce((sum: number, r: any) => sum + r.totalRegistrations, 0);
      const byCountry: Record<string, number> = {};
      const byLevel: Record<string, number> = {};
      for (const r of rows) {
        for (const [c, n] of Object.entries(r.byCountry || {})) byCountry[c] = (byCountry[c] || 0) + (n as number);
        for (const [l, n] of Object.entries(r.byLevel || {})) byLevel[l] = (byLevel[l] || 0) + (n as number);
      }
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayCount = rows.find((r: any) => r.date === today)?.totalRegistrations || 0;
      return (
        <div className="space-y-6">
          <StatGrid
            stats={[
              { label: 'Registrations (period)', value: total },
              { label: 'Registrations Today', value: todayCount },
              { label: 'Countries', value: Object.keys(byCountry).length },
              { label: 'Programs', value: Object.keys(byLevel).length },
            ]}
          />
          {rows.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="totalRegistrations" name="Registrations" stroke={CHART_COLORS[0]} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No registrations match the current filters.</p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">By Country</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                {Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
                  <div key={country} className="flex justify-between text-sm">
                    <span>{country}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(byCountry).length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">By Learning Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                {Object.entries(byLevel).sort((a, b) => b[1] - a[1]).map(([level, count]) => (
                  <div key={level} className="flex justify-between text-sm">
                    <span>{level}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(byLevel).length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    case 'parent-activity': {
      const rows = sortRows(Array.isArray(data) ? data : []);
      const totalChildren = rows.reduce((sum: number, r: any) => sum + r.totalStudents, 0);
      return (
        <div className="space-y-6">
          <StatGrid
            stats={[
              { label: 'Total Parents', value: rows.length },
              { label: 'Linked Children', value: totalChildren },
              { label: 'Avg Children / Parent', value: rows.length > 0 ? (totalChildren / rows.length).toFixed(1) : 0 },
              { label: 'Notifications Sent', value: rows.reduce((s: number, r: any) => s + r.notificationsReceived, 0) },
            ]}
          />
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Parent" sortKey="parentName" onSort={onSort} />
                  <TableHead>Email</TableHead>
                  <SortableHead label="Children" sortKey="totalStudents" onSort={onSort} />
                  <SortableHead label="Notifications" sortKey="notificationsReceived" onSort={onSort} />
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No parents match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row: any) => (
                    <TableRow key={row.parentId}>
                      <TableCell className="font-medium">{row.parentName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.totalStudents}</TableCell>
                      <TableCell>{row.notificationsReceived}</TableCell>
                      <TableCell>{row.lastActive ? format(new Date(row.lastActive), 'yyyy-MM-dd') : '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    case 'homework': {
      const difficultyData = Object.entries(data.byDifficulty || {}).map(([name, value]) => ({ name, value: value as number }));
      const statusData = [
        { name: 'Completed', value: data.completed },
        { name: 'Pending', value: data.pending },
      ].filter((d) => d.value > 0);
      return (
        <div className="space-y-6">
          <StatGrid
            stats={[
              { label: 'Homework Assigned', value: data.totalHomework },
              { label: 'Completed', value: data.completed, tone: 'good' },
              { label: 'Pending / Missing', value: data.pending, tone: 'warn' },
              { label: 'Avg Completion (days)', value: data.averageCompletionTime },
            ]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Completion Status</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {statusData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No homework in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={70} label>
                        <Cell fill={CHART_COLORS[0]} />
                        <Cell fill={CHART_COLORS[2]} />
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">By Difficulty</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {difficultyData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip />
                      <Bar dataKey="value" name="Homework" fill={CHART_COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Homework per Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(data.byStudent || {}).sort((a: any, b: any) => b[1] - a[1]).map(([student, count]) => (
                <div key={student} className="flex justify-between text-sm">
                  <span>{student}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
              {Object.keys(data.byStudent || {}).length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
            </CardContent>
          </Card>
        </div>
      );
    }

    case 'exams': {
      const trackData = Object.entries(data.byLearningTrack || {}).map(([name, value]) => ({
        name: trackLabel(name),
        value: value as number,
      }));
      const failRate = data.totalExams > 0 ? +(100 - data.passRate).toFixed(2) : 0;
      return (
        <div className="space-y-6">
          <StatGrid
            stats={[
              { label: 'Total Exams', value: data.totalExams },
              { label: 'Students Examined', value: data.totalStudentsTaken },
              { label: 'Average Score', value: data.averageScore },
              { label: 'Highest Score', value: data.highestScore, tone: 'good' },
              { label: 'Lowest Score', value: data.lowestScore, tone: 'bad' },
              { label: 'Pass Rate', value: `${data.passRate}%`, tone: 'good' },
              { label: 'Fail Rate', value: `${failRate}%`, tone: 'bad' },
            ]}
          />
          {trackData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip />
                  <Bar dataKey="value" name="Exams" fill={CHART_COLORS[4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No exams match the current filters.</p>
          )}
        </div>
      );
    }

    case 'teacher-replacements': {
      const details = data.details || [];
      const statusData = Object.entries(data.byStatus || {}).map(([name, value]) => ({ name, value: value as number }));
      const badgeVariant = (status: string) =>
        status === 'active' ? 'default' : status === 'completed' ? 'secondary' : status === 'cancelled' ? 'destructive' : 'outline';
      return (
        <div className="space-y-6">
          <StatGrid
            stats={[
              { label: 'Total Replacements', value: data.totalReplacements },
              { label: 'Upcoming', value: data.upcoming },
              { label: 'Active', value: data.active, tone: 'good' },
              { label: 'Completed', value: data.completed },
              { label: 'Cancelled', value: data.cancelled, tone: 'bad' },
            ]}
          />
          {statusData.length > 0 && (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={70} label>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Original Teacher</TableHead>
                  <TableHead>Replacement Teacher</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No teacher replacements match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  details.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.studentName}</TableCell>
                      <TableCell>{row.originalTeacher}</TableCell>
                      <TableCell>{row.replacementTeacher}</TableCell>
                      <TableCell>{row.startDate}</TableCell>
                      <TableCell>{row.endDate}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{row.reason}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
