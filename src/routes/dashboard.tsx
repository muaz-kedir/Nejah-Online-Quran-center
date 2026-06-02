import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nejah" },
      { name: "description", content: "Nejah Admin Dashboard" },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  ),
});
