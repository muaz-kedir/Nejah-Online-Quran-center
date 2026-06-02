import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { RegisterPage } from "@/pages/auth/RegisterPage";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Nejah" },
      { name: "description", content: "Create your Nejah account" },
    ],
  }),
  component: () => (
    <AuthLayout>
      <RegisterPage />
    </AuthLayout>
  ),
});
