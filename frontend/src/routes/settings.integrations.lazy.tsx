/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createLazyFileRoute('/settings/integrations')({
  component: IntegrationsRedirect,
});

function IntegrationsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/settings', replace: true });
  }, [navigate]);

  return null;
}
