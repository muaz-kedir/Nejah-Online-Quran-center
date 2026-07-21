import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute("/classroom_/$sessionId")({beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      if (!token) throw redirect({ to: "/login" });
      if (role !== "teacher" && role !== "student") throw redirect({ to: "/dashboard" });
    }
  }
});
