import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/teachers_/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/teachers/$id/profile',
      params: { id: params.id },
    });
  },
});
