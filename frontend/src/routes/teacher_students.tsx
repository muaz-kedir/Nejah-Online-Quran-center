import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TeacherLayout } from "@/components/dashboard/TeacherLayout";
import { requireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  UserCheck,
  GraduationCap,
  BarChart3,
  Clock,
  Filter,
  Grid3X3,
  List,
  Loader2,
  ExternalLink,
  MessageSquare,
  BookOpen,
  Activity,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, BentoStatCard, GlassPanel } from "@/components/dashboard/design-system";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const Route = createFileRoute("/teacher_students")({
  component: TeacherStudentsPage,
  beforeLoad: () => requireAuth(["teacher"]),
});

function TeacherStudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stats, setStats] = useState<any>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(meta.page),
        limit: String(meta.limit),
      });
      if (search) query.set("search", search);
      const data = await api<any>(`/teachers/students?${query.toString()}`);
      setStudents(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, limit: 12, totalPages: 1 });
    } catch {
      toast.error("Failed to load students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta({ ...meta, page: 1 });
  };

  const activeStudents = useMemo(
    () => students.filter((s: any) => s.status === "active"),
    [students],
  );
  const avgAttendance = useMemo(
    () =>
      students.length > 0
        ? students.reduce((a: number, s: any) => a + Number(s.attendanceRate || 0), 0) /
          students.length
        : 0,
    [students],
  );

  const statCards = [
    {
      label: "Total Students",
      value: meta.total,
      icon: <Users className="h-5 w-5" />,
      sub: `${activeStudents.length} active`,
    },
    {
      label: "Active Now",
      value: activeStudents.length,
      icon: <UserCheck className="h-5 w-5" />,
      highlight: activeStudents.length > 0,
      sub: `out of ${meta.total} total`,
    },
    {
      label: "Avg Attendance",
      value: `${Math.round(avgAttendance)}%`,
      icon: <BarChart3 className="h-5 w-5" />,
      progress: avgAttendance,
    },
    {
      label: "Quran Levels",
      value: new Set(students.map((s: any) => s.level)).size,
      icon: <BookOpen className="h-5 w-5" />,
      sub: "unique levels",
    },
  ];

  return (
    <TeacherLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          eyebrow="Teacher Workspace"
          title="My Students"
          description="Manage and monitor all students assigned to you."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-xl h-9 w-9 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-xl h-9 w-9 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <BentoStatCard
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                sub={kpi.sub}
                highlight={kpi.highlight}
                progress={kpi.progress}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-background/50 border border-border dark:border-white/5 rounded-2xl p-4">
          <form onSubmit={handleSearch} className="flex gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:min-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or level..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-background border-border rounded-xl text-sm w-full"
              />
            </div>
            <Button
              type="submit"
              className="h-11 px-6 rounded-xl gap-2 bg-nejah-sapphire hover:bg-nejah-azure text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </form>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Filter className="h-4 w-4" />
            <span>
              {meta.total} student{meta.total !== 1 ? "s" : ""} assigned
            </span>
          </div>
        </div>

        {loading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-3"
            }
          >
            {[1, 2, 3, 4, 5, 6].map((i) =>
              viewMode === "grid" ? (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-background/50 border border-border dark:border-white/5 animate-pulse"
                />
              ) : (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-background/50 border border-border dark:border-white/5 animate-pulse"
                />
              ),
            )}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No Students Assigned</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Students assigned to you by the admin will appear here. Your schedule and class
              sessions will be automatically generated once students are assigned.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {students.map((student: any, idx: number) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className="rounded-2xl border-border dark:border-white/5 bg-card dark:bg-nejah-surface hover:shadow-lg hover:border-nejah-electric/20 transition-all cursor-pointer group overflow-hidden"
                  onClick={() =>
                    navigate({
                      to: "/teacher_students/$studentId",
                      params: { studentId: student.id },
                      search: {}
                    })
                  }
                >
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                              student.gender === "FEMALE"
                                ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                            )}
                          >
                            {student.fullName?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground leading-tight">
                              {student.fullName}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {student.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none",
                            student.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {student.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-background/50 rounded-xl p-3 text-center">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            Level
                          </p>
                          <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                            {student.level || "N/A"}
                          </p>
                        </div>
                        <div className="bg-background/50 rounded-xl p-3 text-center">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            Attendance
                          </p>
                          <p className="text-xs font-bold text-foreground mt-0.5">
                            {Math.round(student.attendanceRate || 0)}%
                          </p>
                        </div>
                      </div>

                      {student.isTemporaryAssignment && (
                        <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                          <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-center">
                            Temporary Assignment
                          </p>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground font-medium">Progress</span>
                          <span className="font-bold">
                            {Math.round(student.progressRate || 0)}%
                          </span>
                        </div>
                        <Progress
                          value={student.progressRate || 0}
                          className={cn(
                            "h-1.5",
                            (student.progressRate || 0) >= 80
                              ? "[&>div]:bg-green-500"
                              : (student.progressRate || 0) >= 50
                                ? "[&>div]:bg-amber-500"
                                : "[&>div]:bg-red-500",
                          )}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border dark:border-white/5 px-6 py-3 flex items-center justify-between bg-background/30 dark:bg-nejah-midnight/20">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Next class: —</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({
                            to: "/teacher_students/$studentId",
                            params: { studentId: student.id },
                            search: {}
                          });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassPanel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border dark:border-white/5">
                    <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Student
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Level
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Status
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Attendance
                    </th>
                    <th className="py-4 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Progress
                    </th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:border-white/5">
                  {students.map((student: any) => (
                    <tr
                      key={student.id}
                      className="hover:bg-background/50 dark:hover:bg-nejah-surface/20 transition-all cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/teacher_students/$studentId",
                          params: { studentId: student.id },
                          search: {}
                        })
                      }
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                              student.gender === "FEMALE"
                                ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                            )}
                          >
                            {student.fullName?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{student.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {student.email || "—"}
                            </p>
                          </div>
                          {student.isTemporaryAssignment && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                              Temp
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg border-border dark:border-white/10"
                        >
                          {student.level || "N/A"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              student.status === "active" ? "bg-green-500" : "bg-muted-foreground",
                            )}
                          />
                          <span className="text-xs font-medium">
                            {student.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                (student.attendanceRate || 0) >= 80
                                  ? "bg-green-500"
                                  : (student.attendanceRate || 0) >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500",
                              )}
                              style={{ width: `${Math.min(100, student.attendanceRate || 0)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums min-w-[32px] text-right">
                            {Math.round(student.attendanceRate || 0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                (student.progressRate || 0) >= 80
                                  ? "bg-green-500"
                                  : (student.progressRate || 0) >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500",
                              )}
                              style={{ width: `${Math.min(100, student.progressRate || 0)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums min-w-[32px] text-right">
                            {Math.round(student.progressRate || 0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({
                              to: "/teacher_students/$studentId",
                              params: { studentId: student.id },
                              search: {}
                            });
                          }}
                          size="sm"
                          className="rounded-lg h-9 px-3 gap-1.5 text-xs font-bold bg-nejah-sapphire hover:bg-nejah-azure text-white"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between bg-background/50 border border-border dark:border-white/5 rounded-2xl px-6 py-4">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                className="rounded-lg h-9 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                className="rounded-lg h-9 px-3"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
