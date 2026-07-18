/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect, useMemo } from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { ParentPortalLayout } from '@/components/parents/ParentPortalLayout';
import { LanguageProvider } from '@/context/LanguageContext';
import { PageHeader, GlassPanel, BentoStatCard } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Video,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Activity,
  Percent,
  GraduationCap,
  RefreshCw,
  Filter,
} from 'lucide-react';

export const Route = createLazyFileRoute('/parent_sessions')({
  component: ParentSessionsRoute,
});

function ParentSessionsRoute() {
  return (
    <LanguageProvider>
      <ParentSessionsPage />
    </LanguageProvider>
  );
}
