import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProgressPage } from "@/pages/dashboard/ProgressPage";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Nejah" },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <ProgressPage />
    </DashboardLayout>
  ),
});
