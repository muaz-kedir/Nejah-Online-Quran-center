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

export const Route = createLazyFileRoute('/zoom-guide')({
  component: ZoomGuidePage,
});

function ZoomGuidePage() {
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
              <h1>Zoom Integration Guide</h1>
              <p>
                This guide explains how teachers can connect their Zoom account to Nejah
                Online Quran Center, use it for live classes, and disconnect when no longer
                needed.
              </p>

              <hr />

              <h2>Adding the Zoom Integration</h2>

              <h3>Prerequisites</h3>
              <ul>
                <li>
                  An active <strong>Zoom account</strong> with a licensed (paid) plan. Free
                  Zoom accounts can host meetings but are limited to 40 minutes for group
                  meetings.
                </li>
                <li>
                  A <strong>Nejah teacher account</strong> approved by an administrator.
                </li>
              </ul>

              <h3>Step 1: Log in to Nejah</h3>
              <ol>
                <li>
                  Go to{" "}
                  <a href="https://nejah-quran.vercel.app/login">
                    https://nejah-quran.vercel.app/login
                  </a>
                </li>
                <li>Enter your email and password.</li>
                <li>Click <strong>Sign In</strong>.</li>
              </ol>

              <h3>Step 2: Navigate to Integrations</h3>
              <ol>
                <li>In the left sidebar, click <strong>Settings</strong>.</li>
                <li>Click <strong>Integrations</strong>.</li>
                <li>You will see the Zoom integration section with a <strong>Connect Zoom</strong> button.</li>
              </ol>

              <h3>Step 3: Connect Your Zoom Account</h3>
              <ol>
                <li>Click <strong>Connect Zoom</strong>.</li>
                <li>
                  You will be redirected to Zoom's website. You may be asked to log in to
                  your Zoom account.
                </li>
                <li>
                  Zoom will display a permissions screen listing the access Nejah is
                  requesting:
                  <ul>
                    <li>View your user profile</li>
                    <li>Create and manage your meetings</li>
                    <li>View your meeting reports and participant data</li>
                    <li>Generate ZAK tokens for host authentication</li>
                  </ul>
                </li>
                <li>
                  Click <strong>Allow</strong> to authorize the integration.
                </li>
                <li>
                  You will be redirected back to Nejah. The integration status will change
                  to <strong>Connected</strong>.
                </li>
              </ol>

              <div className="not-prose bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6">
                <p className="text-sm">
                  <strong>Note:</strong> Your Zoom OAuth tokens are encrypted and stored
                  securely. Nejah only uses these tokens to create and manage meetings for
                  your scheduled classes and to track attendance. We do not access your
                  recordings, personal Zoom settings, or any other Zoom data beyond what is
                  listed above.
                </p>
              </div>

              <hr />

              <h2>Using the Integration</h2>

              <h3>Starting a Live Class</h3>
              <ol>
                <li>
                  When a scheduled class session begins, click <strong>Start Session</strong>{" "}
                  from the teacher dashboard or schedule view.
                </li>
                <li>
                  If no meeting link is provided, Nejah will automatically create a Zoom
                  meeting using your connected account.
                </li>
                <li>
                  Click <strong>Join Meeting</strong> to open the Zoom classroom in a new tab
                  or in the embedded classroom view.
                </li>
                <li>Students can join via the meeting link displayed in their class view.</li>
              </ol>

              <h3>Automatic Attendance Tracking</h3>
              <ul>
                <li>
                  When students join or leave the Zoom meeting, Nejah automatically records
                  their attendance.
                </li>
                <li>
                  Join time, leave time, and duration are logged and displayed in the
                  attendance report.
                </li>
                <li>
                  Teachers can view attendance details in the session report after the class
                  ends.
                </li>
              </ul>

              <h3>Manual Meeting Link</h3>
              <p>
                If you prefer to create a Zoom meeting yourself, you can paste the meeting
                link directly when starting a session. Nejah will use your provided link
                instead of creating one automatically.
              </p>

              <h3>Checking Connection Status</h3>
              <ol>
                <li>
                  Go to <strong>Settings &gt; Integrations</strong>.
                </li>
                <li>
                  The status will show <strong>Connected</strong> with your Zoom email if
                  the integration is active.
                </li>
                <li>
                  Click <strong>Test Connection</strong> to verify the integration is working
                  correctly.
                </li>
              </ol>

              <hr />

              <h2>Removing the Zoom Integration</h2>

              <h3>Disconnecting Your Zoom Account</h3>
              <ol>
                <li>Log in to Nejah as a teacher.</li>
                <li>
                  Go to <strong>Settings &gt; Integrations</strong>.
                </li>
                <li>
                  Next to your connected Zoom account, click <strong>Disconnect Zoom</strong>.
                </li>
                <li>
                  Confirm the disconnection when prompted.
                </li>
              </ol>
              <p>
                <strong>What happens when you disconnect:</strong>
              </p>
              <ul>
                <li>All stored OAuth tokens (access and refresh tokens) are permanently deleted.</li>
                <li>The link between your Nejah account and Zoom account is removed.</li>
                <li>
                  Nejah will no longer create or manage meetings on your behalf.
                </li>
                <li>
                  Past attendance records are retained for historical purposes but are no
                  longer linked to your Zoom account.
                </li>
              </ul>

              <h3>Revoking Access from Zoom's Side</h3>
              <p>
                You can also revoke Nejah's access directly from Zoom:
              </p>
              <ol>
                <li>
                  Log in to{" "}
                  <a href="https://zoom.us/signin" target="_blank" rel="noopener noreferrer">
                    Zoom
                  </a>
                  .
                </li>
                <li>
                  Go to <strong>Settings &gt; Apps &gt; Installed Apps</strong>.
                </li>
                <li>
                  Find the Nejah Online Quran Center app.
                </li>
                <li>
                  Click <strong>Uninstall</strong> or <strong>Remove</strong>.
                </li>
              </ol>
              <p>
                This will immediately revoke the access token. Nejah will detect the
                revocation and mark your integration as disconnected automatically.
              </p>

              <hr />

              <h2>Data Collected by the Integration</h2>
              <p>
                When connected, Nejah collects the following Zoom-related data:
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Purpose</th>
                    <th>Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Zoom User ID</td>
                    <td>Identify the teacher's Zoom account for meeting creation</td>
                    <td>Until disconnected</td>
                  </tr>
                  <tr>
                    <td>Zoom email</td>
                    <td>Link Nejah account to the correct Zoom user</td>
                    <td>Until disconnected</td>
                  </tr>
                  <tr>
                    <td>OAuth access token (encrypted)</td>
                    <td>API calls to create/manage meetings</td>
                    <td>Until disconnected or expired</td>
                  </tr>
                  <tr>
                    <td>OAuth refresh token (encrypted)</td>
                    <td>Refresh expired access tokens</td>
                    <td>Until disconnected</td>
                  </tr>
                  <tr>
                    <td>Participant join/leave events</td>
                    <td>Automatic attendance tracking</td>
                    <td>Retained as session records</td>
                  </tr>
                </tbody>
              </table>
              <p>
                For full details, see our{" "}
                <a href="https://nejah-quran.vercel.app/privacy-policy">Privacy Policy</a>.
              </p>

              <hr />

              <h2>Troubleshooting</h2>

              <h3>"Zoom account not connected" error</h3>
              <p>
                This means your OAuth tokens may have expired or been revoked. Go to{" "}
                <strong>Settings &gt; Integrations</strong> and reconnect your Zoom account.
              </p>

              <h3>Zoom meeting was not created automatically</h3>
              <ol>
                <li>Verify your Zoom connection status is <strong>Connected</strong>.</li>
                <li>Ensure you have a licensed Zoom account (not Basic with 40-min limit).</li>
                <li>
                  Check that the Nejah app still has permission in your Zoom account
                  settings.
                </li>
                <li>
                  If the issue persists, contact{" "}
                  <a href="mailto:support@nejahquran.com">support@nejahquran.com</a>.
                </li>
              </ol>

              <h3>Attendance not recording</h3>
              <ol>
                <li>
                  Ensure the meeting was created through Nejah (not manually pasted as a
                  separate link).
                </li>
                <li>
                  Webhook events require the meeting to be hosted by the connected Zoom
                  account.
                </li>
                <li>
                  Check that the meeting ended normally — attendance is finalized when the
                  host ends the meeting.
                </li>
              </ol>

              <h2>Need More Help?</h2>
              <p>
                Contact our support team at{" "}
                <a href="mailto:support@nejahquran.com">support@nejahquran.com</a> or visit
                the{" "}
                <a href="https://nejah-quran.vercel.app/support">Support page</a>.
              </p>
            </div>
          </div>
        </main>
        <Footer />
        <FloatingActions />
      </div>
    </ThemeProvider>
  );
}
