import { redirect } from "@tanstack/react-router";

const ROLE_DASHBOARDS: Record<string, string> = {
  teacher: "/teacher_dashboard",
  student: "/student_dashboard",
  parent: "/parent_dashboard",
  admin: "/dashboard",
  super_admin: "/dashboard",
  finance_manager: "/finance_dashboard",
  qirat_manager: "/qirat_dashboard",
};

export const ACADEMIC_ROLES = ["admin", "super_admin", "qirat_manager"] as const;

function getJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded.exp || null;
  } catch {
    return null;
  }
}

export function requireAuth(allowedRoles?: string[]) {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  if (!token) {
    throw redirect({ to: "/login" });
  }

  if (!role) {
    throw redirect({ to: "/login" });
  }

  const exp = getJwtExpiry(token);
  if (exp && Date.now() >= exp * 1000) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("studentId");
    throw redirect({ to: "/login?reason=session_expired" });
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    throw redirect({ to: ROLE_DASHBOARDS[role] || "/login" });
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userId");
  localStorage.removeItem("studentId");
  window.location.href = "/login";
}
