import { redirect } from '@tanstack/react-router';

const ROLE_DASHBOARDS: Record<string, string> = {
  teacher: '/teacher_dashboard',
  student: '/student_dashboard',
  parent: '/parent_dashboard',
  admin: '/dashboard',
  super_admin: '/dashboard',
  finance_manager: '/finance_dashboard',
  qirat_manager: '/qirat_dashboard',
};

export const ACADEMIC_ROLES = ['admin', 'super_admin', 'qirat_manager'] as const;

export function requireAuth(allowedRoles?: string[]) {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    throw redirect({ to: '/login' });
  }

  if (!role) {
    throw redirect({ to: '/login' });
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    throw redirect({ to: ROLE_DASHBOARDS[role] || '/login' });
  }
}
