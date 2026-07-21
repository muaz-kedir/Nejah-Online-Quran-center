/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute, Outlet } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createLazyFileRoute('/teachers_/$id')({
  component: TeacherIdLayout,
});

function TeacherIdLayout() {
  return <Outlet />;
}
