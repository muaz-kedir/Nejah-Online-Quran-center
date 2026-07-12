import { createFileRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { AnnouncementBanner } from "@/components/site/AnnouncementBanner";
import { Loader } from "@/components/site/Loader";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy - Nejah Online Quran Center" },
      {
        name: "description",
        content:
          "Privacy Policy for Nejah Online Quran Center — how we collect, use, and protect your data including Zoom integration information.",
      },
      {
        name: "keywords",
        content: "privacy policy, data protection, Zoom integration, Nejah Online Quran Center",
      },
      { property: "og:title", content: "Privacy Policy - Nejah Online Quran Center" },
      {
        property: "og:description",
        content: "How Nejah Online Quran Center collects, uses, and protects your data.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nejah-quran.vercel.app/privacy-policy" },
    ],
  }),
});

function PrivacyPolicyPage() {
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
              <h1>Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: July 12, 2026</p>

              <p>
                Nejah Online Quran Center ("we", "us", "our") operates the Nejah platform
                (the "Service"). This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you use our Service, including any Zoom
                integration features.
              </p>

              <h2>1. Information We Collect</h2>

              <h3>Account Information</h3>
              <ul>
                <li>Name and email address (used for authentication and communication)</li>
                <li>Role (teacher, student, parent, or administrator)</li>
                <li>Password (stored securely using industry-standard hashing)</li>
              </ul>

              <h3>Zoom Integration Data</h3>
              <p>
                When a teacher connects their Zoom account via OAuth, we store the following
                information to enable live class functionality:
              </p>
              <ul>
                <li>Zoom User ID — to identify the teacher's Zoom account</li>
                <li>Zoom email address — to link the Nejah account to the correct Zoom user</li>
                <li>OAuth access token (encrypted) — to create and manage meetings on behalf of the teacher</li>
                <li>OAuth refresh token (encrypted) — to obtain new access tokens when they expire</li>
                <li>Token expiration time — to know when to refresh the access token</li>
              </ul>

              <h3>Class Session Data</h3>
              <ul>
                <li>Scheduled and actual class times</li>
                <li>Meeting links and meeting IDs (generated via Zoom)</li>
                <li>Student attendance records (join time, leave time, duration)</li>
                <li>Teacher attendance status</li>
                <li>Session notes and evaluations</li>
              </ul>

              <h3>Zoom Webhook Data</h3>
              <p>
                We receive event notifications from Zoom (via webhooks) to track live session
                activity. This includes:
              </p>
              <ul>
                <li>Meeting start and end events</li>
                <li>Participant join and leave events (names, join/leave timestamps, duration)</li>
                <li>Meeting IDs and UUIDs for event correlation</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <ul>
                <li>
                  <strong>To provide live Quran classes:</strong> We use Zoom integration data to
                  create, manage, and join Zoom meetings for scheduled class sessions.
                </li>
                <li>
                  <strong>To track attendance:</strong> Webhook data allows us to automatically
                  record which students attended a class, when they joined and left, and for
                  how long.
                </li>
                <li>
                  <strong>To authenticate users:</strong> Account information is used to verify
                  identity and control access to different features based on role.
                </li>
                <li>
                  <strong>To communicate:</strong> We may use your email to send session
                  reminders, notifications, and important updates about the Service.
                </li>
                <li>
                  <strong>To improve the Service:</strong> Aggregated, anonymized usage data may
                  be used to improve our platform.
                </li>
              </ul>

              <h2>3. Data Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share data with:</p>
              <ul>
                <li>
                  <strong>Zoom Video Communications, Inc.:</strong> When you connect your Zoom
                  account, your data is processed in accordance with
                  {" "}
                  <a
                    href="https://explore.zoom.us/en/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Zoom's Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Service providers:</strong> We use third-party hosting and database
                  providers (e.g., Render, Vercel, Neon, Cloudflare) to operate the Service.
                  These providers process data on our behalf under strict data protection
                  obligations.
                </li>
                <li>
                  <strong>Legal compliance:</strong> We may disclose information if required by
                  law, regulation, or valid legal process.
                </li>
              </ul>

              <h2>4. Data Retention</h2>
              <ul>
                <li>
                  Account data is retained as long as the account is active or as needed to
                  provide the Service.
                </li>
                <li>
                  Zoom OAuth tokens are deleted when a teacher disconnects their Zoom account.
                </li>
                <li>
                  Class session and attendance records are retained for educational record-keeping
                  purposes.
                </li>
                <li>
                  Webhook event deduplication data is automatically purged after 30 days.
                </li>
              </ul>

              <h2>5. Zoom Data Disconnect and Deletion</h2>
              <p>
                Teachers can disconnect their Zoom account at any time from the
                <strong> Settings &gt; Integrations</strong> page. Upon disconnection:
              </p>
              <ul>
                <li>All stored OAuth tokens (access and refresh) are permanently deleted.</li>
                <li>The Zoom User ID link is removed from the teacher's profile.</li>
                <li>No further Zoom API calls will be made on behalf of the teacher.</li>
                <li>
                  Existing class session records are retained for attendance history but are
                  no longer linked to the Zoom account.
                </li>
              </ul>
              <p>
                To request a complete deletion of all your data (including attendance records
                and class history), please contact us at{" "}
                <a href="mailto:support@nejahquran.com">support@nejahquran.com</a>. We will
                process your deletion request within 30 days.
              </p>

              <h2>6. Data Security</h2>
              <ul>
                <li>OAuth tokens are encrypted at rest using AES-256-GCM encryption.</li>
                <li>All data in transit is protected by TLS encryption.</li>
                <li>Webhook endpoints verify Zoom's cryptographic signatures to prevent tampering.</li>
                <li>Access to the platform is controlled via role-based authentication.</li>
              </ul>

              <h2>7. Your Rights</h2>
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul>
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your personal data.</li>
                <li>Object to or restrict certain processing of your data.</li>
                <li>Data portability — receive your data in a structured, machine-readable format.</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:support@nejahquran.com">support@nejahquran.com</a>.
              </p>

              <h2>8. Children's Privacy</h2>
              <p>
                The Service is used in the context of Quran education for students of various
                ages. For students under 13 (or the applicable age of digital consent in your
                jurisdiction), a parent or guardian must create and manage the account. We do
                not knowingly collect personal information directly from children without
                parental consent.
              </p>

              <h2>9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by posting the new policy on this page and updating the "Last
                updated" date above.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
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
