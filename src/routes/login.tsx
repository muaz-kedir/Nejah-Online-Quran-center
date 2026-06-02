import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginPage } from "@/pages/auth/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Nejah" },
      { name: "description", content: "Sign in to your Nejah account" },
    ],
  }),
  component: () => (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  ),
});
