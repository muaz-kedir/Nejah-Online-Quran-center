/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split).

import { createLazyFileRoute} from "@tanstack/react-router";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { AnnouncementBanner } from "@/components/site/AnnouncementBanner";
import { Loader } from "@/components/site/Loader";

export const Route = createLazyFileRoute('/terms-of-service')({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <ThemeProvider>
      <Loader />
      <div className="relative flex min-h-screen flex-col admin-shell-bg">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
        <AnnouncementBanner />
        <Navbar />
        <main className="relative z-10 flex-1">
          <div className="container-x py-20">
            <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
              <h1>Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Last updated: July 12, 2026</p>

              <p>
                Welcome to Nejah Online Quran Center (the "Service"). These Terms of Service
                ("Terms") govern your access to and use of the Service, including any Zoom
                integration features. By accessing or using the Service, you agree to be bound
                by these Terms.
              </p>

              <h2>1. Acceptance of Terms</h2>
              <p>
                By creating an account or using the Service, you confirm that you have read,
                understood, and agree to be bound by these Terms. If you do not agree, please
                do not use the Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                Nejah Online Quran Center is an online Quran education platform that provides:
              </p>
              <ul>
                <li>Scheduled live Quran classes via Zoom integration</li>
                <li>Student enrollment and progress tracking</li>
                <li>Teacher tools for class management and attendance</li>
                <li>Parent access to their children's progress and sessions</li>
                <li>Evaluation and homework management</li>
              </ul>

              <h2>3. Account Registration</h2>
              <ul>
                <li>
                  You must provide accurate and complete information during registration.
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of your account
                  credentials.
                </li>
                <li>
                  You must notify us immediately of any unauthorized use of your account.
                </li>
                <li>
                  You may not share your account credentials with others or create multiple
                  accounts for the same person.
                </li>
              </ul>

              <h2>4. Zoom Integration</h2>

              <h3>4.1 Connecting Your Zoom Account</h3>
              <p>
                Teachers may optionally connect their personal Zoom account to the Service via
                OAuth. This integration allows the Service to create and manage Zoom meetings
                on the teacher's behalf for scheduled class sessions.
              </p>
              <ul>
                <li>
                  By connecting your Zoom account, you authorize Nejah to create meetings,
                  retrieve meeting information, and track participant attendance using your
                  Zoom account.
                </li>
                <li>
                  This authorization is limited to the specific scopes required for class
                  management and does not grant access to other Zoom features or data.
                </li>
                <li>
                  You can revoke this authorization at any time from{" "}
                  <strong>Settings &gt; Integrations</strong> by disconnecting your Zoom
                  account.
                </li>
              </ul>

              <h3>4.2 Zoom Meeting Responsibilities</h3>
              <ul>
                <li>
                  Teachers are responsible for ensuring they have a valid Zoom license
                  compatible with the Service's requirements.
                </li>
                <li>
                  Teachers should not share meeting links outside of the Service's intended
                  student audience.
                </li>
                <li>
                  Zoom meetings are subject to Zoom's own Terms of Service and Acceptable Use
                  Policies.
                </li>
              </ul>

              <h3>4.3 Attendance Tracking</h3>
              <p>
                The Service uses Zoom webhooks to automatically track when students join and
                leave live class sessions. This data is used solely for attendance records and
                educational reporting.
              </p>

              <h2>5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any unlawful or unauthorized purpose</li>
                <li>
                  Attempt to gain unauthorized access to other accounts, systems, or networks
                </li>
                <li>
                  Disrupt, overload, or interfere with the Service's infrastructure
                </li>
                <li>
                  Record, distribute, or share class sessions without the consent of all
                  participants
                </li>
                <li>
                  Use the Zoom integration for purposes other than conducting scheduled
                  educational classes
                </li>
                <li>
                  Harass, abuse, or harm other users of the Service
                </li>
              </ul>

              <h2>6. Intellectual Property</h2>
              <ul>
                <li>
                  The Service, including its code, design, content, and branding, is the
                  property of Nejah Online Quran Center and is protected by intellectual
                  property laws.
                </li>
                <li>
                  Educational materials, Quran recitations, and teacher evaluations shared
                  through the Service remain the intellectual property of their respective
                  owners.
                </li>
                <li>
                  You may not copy, modify, distribute, or reverse-engineer any part of the
                  Service.
                </li>
              </ul>

              <h2>7. Payment and Fees</h2>
              <ul>
                <li>
                  Some features of the Service may require a paid subscription or fees.
                </li>
                <li>
                  Fee structures and payment terms are communicated separately and may be
                  updated from time to time.
                </li>
                <li>
                  Fees are non-refundable unless otherwise stated in our refund policy.
                </li>
              </ul>

              <h2>8. Limitation of Liability</h2>
              <ul>
                <li>
                  The Service is provided "as is" and "as available" without warranties of any
                  kind, either express or implied.
                </li>
                <li>
                  We do not guarantee uninterrupted or error-free operation of the Service.
                </li>
                <li>
                  We are not liable for any interruption of Zoom services, internet outages,
                  or third-party failures that affect the Service.
                </li>
                <li>
                  In no event shall our total liability exceed the amount paid by you to us in
                  the twelve (12) months preceding the claim.
                </li>
              </ul>

              <h2>9. Termination</h2>
              <ul>
                <li>
                  You may terminate your account at any time by contacting us at{" "}
                  <a href="mailto:support@nejahquran.com">support@nejahquran.com</a>.
                </li>
                <li>
                  We reserve the right to suspend or terminate your account if you violate
                  these Terms or engage in conduct that we reasonably believe is harmful to
                  other users or the Service.
                </li>
                <li>
                  Upon termination, your access to the Service will cease. We may retain
                  certain data as described in our Privacy Policy.
                </li>
              </ul>

              <h2>10. Dispute Resolution</h2>
              <p>
                Any disputes arising out of or relating to these Terms or the Service shall be
                resolved through good-faith negotiation. If we cannot reach an agreement
                within 30 days, either party may pursue resolution through binding arbitration
                or in a court of competent jurisdiction.
              </p>

              <h2>11. Changes to These Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of
                material changes by posting the updated Terms on this page and updating the
                "Last updated" date. Your continued use of the Service after changes are
                posted constitutes your acceptance of the updated Terms.
              </p>

              <h2>12. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul>
                <li>Email: <a href="mailto:support@nejahquran.com">support@nejahquran.com</a></li>
                <li>Website: <a href="https://nejah-quran.vercel.app">https://nejah-quran.vercel.app</a></li>
              </ul>
            </div>
          </div>
        </main>
        <Footer />
        <FloatingActions />
      </div>
    </ThemeProvider>
  );
}
