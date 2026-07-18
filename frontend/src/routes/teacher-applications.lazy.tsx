/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Search, Filter, ChevronLeft, ChevronRight, FileCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Users, Eye, RefreshCw, Power, PowerOff, Copy, Check, Link as LinkIcon, UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { apiHeaders, apiUrl } from "@/lib/api";
import { cn } from '@/lib/utils';

export const Route = createLazyFileRoute('/teacher-applications')({
  component: TeacherApplicationsPage,
});

function TeacherApplicationsPage() {
  return (
    <DashboardLayout>
      <TeacherApplicationsContent />
    </DashboardLayout>
  );
}
