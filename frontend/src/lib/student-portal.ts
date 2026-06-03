import { API_BASE, api, apiHeaders } from '@/lib/api';

export { API_BASE, api, apiHeaders };

export function requireStudentAuth() {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token) {
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }
  if (role !== 'student') {
    window.location.href = '/dashboard';
    throw new Error('Access denied');
  }
}

export const studentPaths = {
  dashboard: '/student_dashboard',
  classes: '/student/classes',
  progress: '/student/progress',
  homework: '/student/homework',
  resources: '/student/resources',
  messages: '/student/messages',
  notifications: '/student/notifications',
} as const;
