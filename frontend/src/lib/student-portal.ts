import { redirect, isRedirect } from '@tanstack/react-router';
import { API_BASE, api, apiHeaders, apiUrl } from '@/lib/api';

export { API_BASE, api, apiHeaders, apiUrl };

export async function requireStudentAuth() {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token) {
    throw redirect({ to: '/login' });
  }
  if (role !== 'student') {
    throw redirect({ to: '/dashboard' });
  }
  await checkOnboarding();
}

async function checkOnboarding(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/setup-required') return;

  try {
    const res = await fetch(apiUrl('/onboarding/status'), { headers: apiHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (!data.onboardingCompleted) {
        throw redirect({ to: '/setup-required' });
      }
    }
  } catch (e: any) {
    if (isRedirect(e)) throw e;
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
  evaluations: '/student/evaluations',
} as const;
