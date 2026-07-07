import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  ClipboardList,
  TrendingUp,
  Shield,
  UsersRound,
  FolderOpen,
  Bell,
  UserCircle,
  FileCheck,
  UserCog,
  DollarSign,
  LineChart,
  Receipt,
  CheckCircle,
  Video,
  VideoOff,
  Layout,
  FileText,
  Ticket,
  ChevronDown,
  Home,
  BookMarked,
  MessageSquareText,
} from 'lucide-react';

export interface MenuItem {
  label: string;
  icon: any;
  path: string;
  badge?: string;
  children?: MenuItem[];
}

export const menuByRole: Record<string, MenuItem[]> = {
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Staff Management', icon: Shield, path: '/admins' },
    { label: 'Teacher Applications', icon: FileCheck, path: '/teacher-applications' },
    { label: 'Parents', icon: UsersRound, path: '/parents' },

    {
      label: 'Qirat Manager', icon: BookMarked, path: '#',
      children: [
        { label: 'Teachers', icon: GraduationCap, path: '/teachers' },
        { label: 'Students', icon: Users, path: '/students' },
        { label: 'Quran Progress', icon: BookOpen, path: '/progress' },
        { label: 'Homework', icon: ClipboardList, path: '/homework' },
        { label: 'Schedules', icon: Calendar, path: '/schedules' },
        { label: 'Live Sessions', icon: Video, path: '/live-sessions' },
        { label: 'Session Analytics', icon: TrendingUp, path: '/live-sessions/analytics' },
        { label: 'Teacher Replacements', icon: UserCog, path: '/teacher-replacements' },
        { label: 'Exams & Evaluations', icon: CheckCircle, path: '/qirat_exams' },
      ],
    },

    {
      label: 'Finance', icon: DollarSign, path: '#',
      children: [
        { label: 'Finance Dashboard', icon: LayoutDashboard, path: '/finance_dashboard' },
        { label: 'Student Payments', icon: Receipt, path: '/finance_student-payments' },
        { label: 'Family Payments', icon: UsersRound, path: '/finance_family-payments' },
        { label: 'Teacher Payments', icon: GraduationCap, path: '/finance_teacher-payments' },
        { label: 'Revenue Analytics', icon: LineChart, path: '/finance_revenue' },
        { label: 'Financial Reports', icon: BarChart3, path: '/finance_reports' },
      ],
    },

    { label: 'Reports', icon: BarChart3, path: '/reports' },
    { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
    {
      label: 'Website CMS', icon: Layout, path: '#',
      children: [
        { label: 'Home Page', icon: Home, path: '/website/home' },
        { label: 'Teachers', icon: GraduationCap, path: '/website/home' },
        { label: 'Testimonials', icon: MessageSquareText, path: '/website/home' },
        { label: 'Learning Resources', icon: BookMarked, path: '/website/resources' },
        { label: 'Support Pages', icon: FileText, path: '/website/support/pages' },
        { label: 'Support Tickets', icon: Ticket, path: '/website/support/tickets' },
        { label: 'Support Analytics', icon: TrendingUp, path: '/website/support/analytics' },
      ],
    },
    { label: 'Notifications', icon: Bell, path: '/teacher_notifications' },
    { label: 'Zoom Settings', icon: VideoOff, path: '/zoom-settings' },
    { label: 'System Settings', icon: Settings, path: '/settings' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Teachers', icon: GraduationCap, path: '/teachers' },
    { label: 'Teacher Applications', icon: FileCheck, path: '/teacher-applications' },
    { label: 'Students', icon: Users, path: '/students' },
    { label: 'Parents', icon: UsersRound, path: '/parents' },
    { label: 'Live Sessions', icon: Video, path: '/live-sessions' },
    { label: 'Session Analytics', icon: BarChart3, path: '/live-sessions/analytics' },
    { label: 'Teacher Replacements', icon: UserCog, path: '/teacher-replacements' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
    { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
    { label: 'Notifications', icon: Bell, path: '/teacher_notifications' },
    { label: 'Zoom Settings', icon: VideoOff, path: '/zoom-settings' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student_dashboard' },
    { label: 'My Classes', icon: Users, path: '/student/classes' },
    { label: 'My Progress', icon: TrendingUp, path: '/student/progress' },
    { label: 'Homework', icon: ClipboardList, path: '/student/homework' },
    { label: 'Resources', icon: FolderOpen, path: '/student/resources' },
  ],
  parent: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/parent_dashboard' },
    { label: 'Sessions', icon: Video, path: '/parent_sessions' },
  ],
  qirat_manager: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/qirat_dashboard' },
    { label: 'Live Sessions', icon: Video, path: '/live-sessions' },
    { label: 'Session Analytics', icon: BarChart3, path: '/live-sessions/analytics' },
    { label: 'Students', icon: Users, path: '/students' },
    { label: 'Teachers', icon: GraduationCap, path: '/teachers' },
    { label: 'Teacher Replacements', icon: UserCog, path: '/teacher-replacements' },
    { label: 'Schedules', icon: Calendar, path: '/schedules' },
    { label: 'Homework', icon: ClipboardList, path: '/homework' },
    { label: 'Quran Progress', icon: BookOpen, path: '/progress' },
    { label: 'Exams & Evaluations', icon: CheckCircle, path: '/qirat_exams' },
    { label: 'Academic Reports', icon: BarChart3, path: '/reports' },
    { label: 'Notifications', icon: Bell, path: '/qirat_notifications' },
    { label: 'Profile Settings', icon: UserCircle, path: '/qirat_settings' },
  ],
  finance_manager: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/finance_dashboard' },
    { label: 'Student Payments', icon: Receipt, path: '/finance_student-payments' },
    { label: 'Family Payments', icon: UsersRound, path: '/finance_family-payments' },
    { label: 'Teacher Payments', icon: GraduationCap, path: '/finance_teacher-payments' },
    { label: 'Revenue Analytics', icon: LineChart, path: '/finance_revenue' },
    { label: 'Financial Reports', icon: BarChart3, path: '/finance_reports' },
    { label: 'Notifications', icon: Bell, path: '/finance_notifications' },
    { label: 'Profile Settings', icon: UserCircle, path: '/finance_settings' },
  ],
};
