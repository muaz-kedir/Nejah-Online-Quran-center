import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/settings/integrations')({
  component: IntegrationsRedirect,
});

function IntegrationsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('zoom') === 'connected') {
      navigate({ to: '/zoom-settings', search: { zoom_oauth: 'success' } as any, replace: true });
    } else {
      navigate({ to: '/settings', replace: true });
    }
  }, [navigate]);

  return null;
}
