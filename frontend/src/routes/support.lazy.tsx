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

export const Route = createLazyFileRoute('/support')({
  component: SupportPage,
});

function SupportPage() {
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
              <h1>Support</h1>
              <p>
                We're here to help. Find answers to common questions below or reach out
                to our support team directly.
              </p>

              <h2>Contact Us</h2>
              <p>
                For any questions, issues, or feedback, you can reach us through:
              </p>
              <ul>
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:support@nejahquran.com">support@nejahquran.com</a>
                </li>
                <li>
                  <strong>Website:</strong>{" "}
                  <a href="https://nejah-quran.vercel.app">
                    https://nejah-quran.vercel.app
                  </a>
                </li>
              </ul>
              <p>
                We aim to respond to all support requests within 24–48 hours during
                business days.
              </p>

              <h2>Frequently Asked Questions</h2>

              <h3>How do I create an account?</h3>
              <p>
                Visit our{" "}
                <a href="https://nejah-quran.vercel.app/register">registration page</a>{" "}
                and fill in your details. Students and parents register through the
                website. Teachers are invited by an administrator after their application
                is approved.
              </p>

              <h3>How do I reset my password?</h3>
              <p>
                Go to the{" "}
                <a href="https://nejah-quran.vercel.app/forgot-password">
                  forgot password page
                </a>{" "}
                and enter your email address. You will receive a link to reset your
                password.
              </p>

              <h3>How do I connect my Zoom account as a teacher?</h3>
              <ol>
                <li>Log in to your teacher account.</li>
                <li>
                  Navigate to <strong>Settings &gt; Integrations</strong> in the
                  dashboard.
                </li>
                <li>Click <strong>Connect Zoom</strong>.</li>
                <li>
                  You will be redirected to Zoom to authorize the app. Click{" "}
                  <strong>Allow</strong> to grant the necessary permissions.
                </li>
                <li>
                  You will be redirected back to Nejah. Your Zoom account is now
                  connected.
                </li>
              </ol>

              <h3>How do I disconnect my Zoom account?</h3>
              <ol>
                <li>Go to <strong>Settings &gt; Integrations</strong>.</li>
                <li>
                  Click <strong>Disconnect Zoom</strong> next to your connected
                  account.
                </li>
                <li>
                  All stored Zoom tokens will be permanently deleted and no further
                  meetings will be created on your behalf.
                </li>
              </ol>

              <h3>How do I request deletion of my data?</h3>
              <p>
                Send an email to{" "}
                <a href="mailto:support@nejahquran.com">support@nejahquran.com</a>{" "}
                with the subject line <strong>"Data Deletion Request"</strong> and
                include:
              </p>
              <ul>
                <li>Your full name</li>
                <li>The email address associated with your account</li>
                <li>Your role (teacher, student, or parent)</li>
              </ul>
              <p>
                We will process your request within 30 days and confirm once your data
                has been deleted.
              </p>

              <h3>A Zoom meeting didn't start or failed. What should I do?</h3>
              <ol>
                <li>
                  Verify that your Zoom account is still connected under{" "}
                  <strong>Settings &gt; Integrations</strong>.
                </li>
                <li>
                  Ensure you have an active Zoom license (Basic accounts have a 40-minute
                  limit on group meetings).
                </li>
                <li>
                  If the issue persists, contact us at{" "}
                  <a href="mailto:support@nejahquran.com">support@nejahquran.com</a>{" "}
                  with the session details.
                </li>
              </ol>

              <h3>How do I update my account information?</h3>
              <p>
                Go to <strong>Profile</strong> in the dashboard to update your name,
                email, or profile picture. For role or account-level changes, please
                contact our support team.
              </p>

              <h3>Can parents view their child's attendance?</h3>
              <p>
                Yes. Parents can log in to the parent portal to view their child's
                attendance records, class sessions, and progress.
              </p>

              <h2>Zoom Integration Support</h2>
              <p>
                For detailed instructions on setting up, using, and removing the Zoom
                integration, see our{" "}
                <a href="https://nejah-quran.vercel.app/zoom-guide">
                  Zoom Integration Guide
                </a>
                .
              </p>

              <h2>Report a Bug</h2>
              <p>
                If you encounter a bug or unexpected behavior, please email us at{" "}
                <a href="mailto:support@nejahquran.com">support@nejahquran.com</a>{" "}
                with:
              </p>
              <ul>
                <li>A description of the issue</li>
                <li>Steps to reproduce the problem</li>
                <li>Your browser and device (e.g., Chrome on Windows, Safari on iPhone)</li>
                <li>Any error messages displayed on screen</li>
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
