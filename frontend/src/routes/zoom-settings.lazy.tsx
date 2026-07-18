/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect, useMemo } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { api, API_BASE } from '@/lib/api';
import {
  Video,
  Link2,
  Link2Off,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createLazyFileRoute('/zoom-settings')({
  component: ZoomSettingsPage,
});

function ZoomSettingsPage() {
  const userRole =
    typeof window !== 'undefined' ? localStorage.getItem('userRole') || '' : '';
  const isAdminView = ADMIN_ROLES.includes(userRole);

  const Layout = isAdminView ? DashboardLayout : TeacherLayout;

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-nejah-slate-blue mb-1">
            Integration
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Zoom Settings</h1>
          <p className="text-sm leading-relaxed text-nejah-slate-blue mt-1">
            {isAdminView
              ? 'Manage Zoom connections for all teachers. Server-to-Server OAuth is configured at the platform level.'
              : 'Connect your Zoom account to enable automatic meeting creation and attendance tracking.'}
          </p>
        </div>

        {isAdminView ? <AdminZoomPanel /> : <TeacherZoomPanel />}
      </div>
    </Layout>
  );
}
