/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, Download, User,
  BookOpen, FileText, Loader2, Mail, Phone, MapPin, Globe, Calendar,
  MessageSquare, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { API_BASE, apiHeaders, apiUrl } from "@/lib/api";

export const Route = createLazyFileRoute('/teacher-applications_/$id')({
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  return (
    <DashboardLayout>
      <ApplicationDetailContent />
    </DashboardLayout>
  );
}
