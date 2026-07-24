import { createFileRoute, useNavigate } from '@tanstack/react-router';
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

interface ApplicationDetail {
  id: string;
  applicationNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth: string | null;
  phoneNumber: string;
  email: string;
  country: string;
  city: string | null;
  streetAddress: string | null;
  languages: string[];
  internetConnectionType: string | null;
  qiratEducationLevel: string | null;
  islamicEducationLevel: string | null;
  teachingTimeAvailability: string[];
  marketingSource: string | null;
  nationalIdUrl: string | null;
  quranCertificateUrl: string | null;
  islamicCertificateUrl: string | null;
  teachingExperienceUrl: string | null;
  cvResumeUrl: string | null;
  additionalComments: string | null;
  status: string;
  adminNotes: string | null;
  rejectionReason: string | null;
  infoRequestMessage: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdTeacherId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-primary', bg: 'bg-primary/10 border-primary/200', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  MORE_INFO_REQUIRED: { label: 'More Info Required', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertCircle },
};

export const Route = createFileRoute('/teacher-applications_/$id')({
  component: ApplicationDetailPage,
  beforeLoad: () => requireAuth(['super_admin']),
});

function ApplicationDetailContent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/teacher-applications/${id}`), { headers: apiHeaders() });
      if (!res.ok) throw new Error('Failed to fetch application');
      const data = await res.json();
      setApp(data);
      setAdminNotes(data.adminNotes || '');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchApplication(); }, [fetchApplication]);

  const handleReview = async (action: string, extra: Record<string, string> = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(apiUrl(`/teacher-applications/${id}/review`), {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ action, adminNotes, ...extra }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Action failed');
      }
      toast.success(
        action === 'approve' ? 'Application approved! Teacher account created.' :
        action === 'reject' ? 'Application rejected.' : 'Information requested.',
      );
      setShowRejectModal(false);
      setShowInfoModal(false);
      fetchApplication();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Application not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: '/teacher-applications' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Applications
        </Button>
      </div>
    );
  }

  const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING_REVIEW;
  const StatusIcon = sc.icon;
  const isReviewable = app.status !== 'APPROVED';
  const backendUrl = API_BASE.replace('/api', '');

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground mb-2 -ml-2"
            onClick={() => navigate({ to: '/teacher-applications' })}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Applications
          </Button>
          <h1 className="text-2xl font-bold text-foreground text-foreground font-serif">{app.fullName}</h1>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">{app.applicationNumber}</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${sc.bg} ${sc.color}`}>
          <StatusIcon className="h-4 w-4" />
          {sc.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField icon={User} label="Full Name" value={app.fullName} />
              <InfoField icon={User} label="Gender" value={app.gender} />
              <InfoField icon={Calendar} label="Date of Birth" value={app.dateOfBirth} />
              <InfoField icon={Phone} label="Phone" value={app.phoneNumber} />
              <InfoField icon={Mail} label="Email" value={app.email} />
              <InfoField icon={Globe} label="Country" value={app.country} />
              <InfoField icon={MapPin} label="City" value={app.city} />
              <InfoField icon={MapPin} label="Street Address" value={app.streetAddress} />
            </div>
          </Section>

          {/* Education */}
          <Section title="Education & Qualifications" icon={BookOpen}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Languages Spoken</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {app.languages?.map(lang => (
                    <span key={lang} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/200">{lang}</span>
                  ))}
                </div>
              </div>
              <InfoField label="Internet Connection" value={app.internetConnectionType} />
              <InfoField label="Qirat Level" value={app.qiratEducationLevel} />
              <InfoField label="Islamic Education" value={app.islamicEducationLevel} />
              <InfoField label="Marketing Source" value={app.marketingSource} />
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Teaching Availability</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {app.teachingTimeAvailability?.map(time => (
                    <span key={time} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">{time}</span>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Documents */}
          <Section title="Uploaded Documents" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'National ID / Passport', url: app.nationalIdUrl },
                { label: 'Quran Certificate', url: app.quranCertificateUrl },
                { label: 'Islamic Education Certificate', url: app.islamicCertificateUrl },
                { label: 'Teaching Experience', url: app.teachingExperienceUrl },
                { label: 'CV / Resume', url: app.cvResumeUrl },
              ].map(doc => (
                <div key={doc.label} className={`flex items-center justify-between p-3 rounded-xl border ${
                  doc.url ? 'border-primary/200 bg-primary/10/50' : 'border-border bg-muted'
                }`}>
                  <div className="flex items-center gap-2">
                    <FileText className={`h-4 w-4 ${doc.url ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${doc.url ? 'text-foreground' : 'text-muted-foreground'}`}>{doc.label}</span>
                  </div>
                  {doc.url ? (
                    <a href={`${backendUrl}${doc.url}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:text-foreground dark:hover:text-nejah-electric text-xs font-medium transition-colors">
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Not uploaded</span>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Comments */}
          {app.additionalComments && (
            <Section title="Additional Comments" icon={MessageSquare}>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{app.additionalComments}</p>
            </Section>
          )}
        </div>

        {/* Sidebar — Actions */}
        <div className="space-y-6">
          {/* Application Info */}
          <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue p-5">
            <h3 className="font-semibold text-foreground dark:text-foreground text-sm mb-4">Application Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium text-foreground dark:text-muted-foreground">
                  {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {app.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span className="font-medium text-foreground dark:text-muted-foreground">
                    {new Date(app.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )}
              {app.createdTeacherId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teacher Created</span>
                  <span className="text-primary font-medium">✓ Yes</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue p-5">
            <h3 className="font-semibold text-foreground dark:text-foreground text-sm mb-3">Admin Notes</h3>
            <Textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this application..."
              className="bg-muted border-border min-h-[80px] text-sm"
            />
          </div>

          {/* Previous Review Info */}
          {app.rejectionReason && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
              <h3 className="font-semibold text-red-800 text-sm mb-2">Rejection Reason</h3>
              <p className="text-sm text-red-700">{app.rejectionReason}</p>
            </div>
          )}
          {app.infoRequestMessage && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="font-semibold text-blue-800 text-sm mb-2">Information Requested</h3>
              <p className="text-sm text-blue-700">{app.infoRequestMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          {isReviewable && (
            <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue p-5 space-y-3">
              <h3 className="font-semibold text-foreground dark:text-foreground text-sm mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Review Actions
              </h3>
              <Button className="w-full bg-primary hover:bg-nejah-azure shadow-md" disabled={actionLoading}
                onClick={() => handleReview('approve')}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Approve Application
              </Button>
              <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowRejectModal(true)}>
                <XCircle className="h-4 w-4 mr-2" /> Reject Application
              </Button>
              <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => setShowInfoModal(true)}>
                <AlertCircle className="h-4 w-4 mr-2" /> Request More Info
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <ModalOverlay onClose={() => setShowRejectModal(false)}>
          <h3 className="text-lg font-bold text-foreground mb-3">Reject Application</h3>
          <p className="text-sm text-muted-foreground mb-4">Please provide a reason for rejection. This will be sent to the applicant via email.</p>
          <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..." className="min-h-[100px] mb-4" />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" disabled={actionLoading}
              onClick={() => handleReview('reject', { rejectionReason })}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </div>
        </ModalOverlay>
      )}

      {/* Info Request Modal */}
      {showInfoModal && (
        <ModalOverlay onClose={() => setShowInfoModal(false)}>
          <h3 className="text-lg font-bold text-foreground mb-3">Request Additional Information</h3>
          <p className="text-sm text-muted-foreground mb-4">Send a message to the applicant requesting additional documents or information.</p>
          <Textarea value={infoMessage} onChange={e => setInfoMessage(e.target.value)}
            placeholder="Enter your message to the applicant..." className="min-h-[100px] mb-4" />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowInfoModal(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={actionLoading}
              onClick={() => handleReview('request_info', { infoRequestMessage: infoMessage })}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Send Request
            </Button>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}

// ─── Reusable Components ──────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue p-5">
      <h3 className="font-semibold text-foreground dark:text-foreground text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

function InfoField({ icon: Icon, label, value }: { icon?: any; label: string; value?: string | null }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      <p className="text-sm text-foreground dark:text-foreground font-medium mt-0.5 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value || <span className="text-muted-foreground italic">—</span>}
      </p>
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

function ApplicationDetailPage() {
  return (
    <DashboardLayout>
      <ApplicationDetailContent />
    </DashboardLayout>
  );
}
