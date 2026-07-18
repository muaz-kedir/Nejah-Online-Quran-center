import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute("/parent_dashboard")({validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || 'dashboard'
    };
  },
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      if (!token) {
        throw redirect({ to: "/login" });
      }
      if (role !== "parent") {
        throw redirect({ to: "/dashboard" });
      }
    }
  }
});
