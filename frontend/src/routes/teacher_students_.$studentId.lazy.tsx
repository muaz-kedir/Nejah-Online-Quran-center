/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect } from 'react';
import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ChevronLeft, User, BookOpen, ClipboardList, TrendingUp, Video, Loader2, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TeacherStudentHomeworkPanel } from '@/components/teachers/TeacherStudentHomeworkPanel';
import { TeacherStudentProgressPanel } from '@/components/teachers/TeacherStudentProgressPanel';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export const Route = createLazyFileRoute('/teacher_students_/$studentId')({
  component: TeacherStudentDetailPage,
});

function TeacherStudentDetailPage() {
  return (
    <TeacherLayout>
      <TeacherStudentDetailContent />
    </TeacherLayout>
  );
}
