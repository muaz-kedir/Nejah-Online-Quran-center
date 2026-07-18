/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { ParentPortalLayout } from '@/components/parents/ParentPortalLayout';
import { LanguageProvider } from '@/context/LanguageContext';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Video,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const Route = createLazyFileRoute('/parent_notifications')({
  component: ParentNotificationsRoute,
});

function ParentNotificationsRoute() {
  return (
    <LanguageProvider>
      <ParentNotificationsPage />
    </LanguageProvider>
  );
}
