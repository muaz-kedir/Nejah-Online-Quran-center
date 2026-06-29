import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/live-sessions_/$id')({
  beforeLoad: () => {
    throw redirect({ to: '/live-sessions' });
  },
});
