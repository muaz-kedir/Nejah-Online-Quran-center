import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/settings/integrations')({
  component: IntegrationsRedirect,
});

function IntegrationsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/settings', replace: true });
  }, [navigate]);

  return null;
}
