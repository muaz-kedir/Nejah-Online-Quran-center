const ROLE_DASHBOARDS: Record<string, string> = {
  teacher: '/teacher_dashboard',
  student: '/student_dashboard',
  parent: '/parent_dashboard',
  admin: '/dashboard',
  super_admin: '/dashboard',
};

export function requireAuth(allowedRoles?: string[]) {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) {
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }

  if (!role) {
    window.location.href = '/login';
    throw new Error('No role found');
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    window.location.href = ROLE_DASHBOARDS[role] || '/login';
    throw new Error('Access denied');
  }
}
