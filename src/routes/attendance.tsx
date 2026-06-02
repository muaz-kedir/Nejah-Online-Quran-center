import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AttendancePage } from "@/pages/dashboard/AttendancePage";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Nejah" },
    ],
  }),
  component: () => (
    <DashboardLayout>
      <AttendancePage />
    </DashboardLayout>
  ),
});
