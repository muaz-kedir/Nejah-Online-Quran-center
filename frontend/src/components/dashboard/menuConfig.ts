import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  ClipboardList,
  TrendingUp,
  Shield,
  UsersRound,
  FolderOpen,
  Bell,
  UserCircle,
} from 'lucide-react';

export interface MenuItem {
  label: string;
  icon: any;
  path: string;
  badge?: string;
}

export const menuByRole: Record<string, MenuItem[]> = {
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Admins', icon: Shield, path: '/admins' },
    { label: 'Teachers', icon: GraduationCap, path: '/teachers' },
    { label: 'Students', icon: Users, path: '/students' },
    { label: 'Parents', icon: UsersRound, path: '/parents' },
    { label: 'Attendance', icon: UserCheck, path: '/attendance' },
    { label: 'Quran Progress', icon: BookOpen, path: '/progress' },
    { label: 'Homework', icon: ClipboardList, path: '/homework' },
    { label: 'Schedules', icon: Calendar, path: '/schedules' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
    { label: 'Analytics', icon: TrendingUp, path: '/analytics' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
    { label: 'System Settings', icon: Settings, path: '/settings' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Teachers', icon: GraduationCap, path: '/teachers' },
    { label: 'Students', icon: Users, path: '/students' },
    { label: 'Parents', icon: UsersRound, path: '/parents' },
    { label: 'Attendance', icon: UserCheck, path: '/attendance' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ],
  teacher: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher_dashboard' },
    { label: 'Students', icon: Users, path: '/teacher_students' },
    { label: 'Schedule', icon: Calendar, path: '/teacher_schedule' },
    { label: 'Notifications', icon: Bell, path: '/teacher_notifications' },
    { label: 'Profile', icon: UserCircle, path: '/teacher_profile' },
    { label: 'Settings', icon: Settings, path: '/teacher_settings' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student_dashboard' },
    { label: 'My Classes', icon: Users, path: '/student/classes' },
    { label: 'My Progress', icon: TrendingUp, path: '/student/progress' },
    { label: 'Homework', icon: ClipboardList, path: '/student/homework' },
    { label: 'Resources', icon: FolderOpen, path: '/student/resources' },
    { label: 'Messages', icon: MessageSquare, path: '/student/messages' },
  ],
  parent: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/parent_dashboard' },
  ],
};
