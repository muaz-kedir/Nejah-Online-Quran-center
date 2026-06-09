import { API_BASE, api, apiHeaders, apiUrl } from '@/lib/api';

export { API_BASE, api, apiHeaders, apiUrl };

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

/** Resolve and cache the linked student profile id for the logged-in student user. */
export async function getLinkedStudentId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const cached = localStorage.getItem('studentId');
  if (cached) return cached;

  try {
    const profile = await api<{ student?: { id: string } }>('/student/profile');
    if (profile?.student?.id) {
      localStorage.setItem('studentId', profile.student.id);
      return profile.student.id;
    }
  } catch {
    // fall through
  }

  return null;
}

export function storeStudentId(studentId: string) {
  if (typeof window !== 'undefined' && studentId) {
    localStorage.setItem('studentId', studentId);
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
