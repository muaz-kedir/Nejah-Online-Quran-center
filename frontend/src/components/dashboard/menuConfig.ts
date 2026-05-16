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
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Students', icon: Users, path: '/my-students' },
    { label: 'Attendance', icon: UserCheck, path: '/attendance' },
    { label: 'Homework', icon: ClipboardList, path: '/homework' },
    { label: 'Quran Progress', icon: BookOpen, path: '/progress' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
    { label: 'Schedule', icon: Calendar, path: '/schedule' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Progress', icon: TrendingUp, path: '/progress' },
    { label: 'Homework', icon: ClipboardList, path: '/homework' },
    { label: 'Attendance', icon: UserCheck, path: '/attendance' },
    { label: 'Schedule', icon: Calendar, path: '/schedule' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
  ],
  parent: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Child Progress', icon: TrendingUp, path: '/child-progress' },
    { label: 'Attendance', icon: UserCheck, path: '/attendance' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
  ],
};
