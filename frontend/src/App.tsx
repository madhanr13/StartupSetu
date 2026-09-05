/**
 * Application Root
 *
 * Route configuration with role-based access control.
 * Uses ProtectedRoute for authentication + RBAC enforcement.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute } from "@/data/navigation";
import type { UserRole } from "@/types";

// Layout
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Public pages
import LoginPage from "@/pages/LoginPage";

// Role-specific dashboards
import GovDashboard from "@/pages/gov/GovDashboard";
import StartupDashboard from "@/pages/startup/StartupDashboard";
import EvaluatorDashboard from "@/pages/evaluator/EvaluatorDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";

// Placeholder for unimplemented pages
import PlaceholderPage from "@/pages/PlaceholderPage";

// Loading state
import LoadingState from "@/components/ui/LoadingState";

/**
 * Smart redirect component — sends user to their role-specific dashboard.
 */
function DashboardRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState variant="full" />;

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={getDefaultRoute(user.role as UserRole)} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public Routes ──────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />

      {/* Smart dashboard redirect */}
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* ── Government Officer Routes ──────────────────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["GOVERNMENT_OFFICER"]} />
        }
      >
        <Route element={<AppLayout />}>
          <Route path="/gov" element={<GovDashboard />} />
          <Route path="/gov/challenges" element={<PlaceholderPage title="Challenges" description="Create, publish, and manage innovation challenges" />} />
          <Route path="/gov/startup-discovery" element={<PlaceholderPage title="Startup Discovery" description="AI-powered startup matching and discovery" />} />
          <Route path="/gov/proposals" element={<PlaceholderPage title="Proposals" description="Review and evaluate startup proposals" />} />
          <Route path="/gov/pilots" element={<PlaceholderPage title="Pilots" description="Manage active pilot programs" />} />
          <Route path="/gov/kpi-analytics" element={<PlaceholderPage title="KPI Analytics" description="Track pilot KPIs and performance metrics" />} />
          <Route path="/gov/procurement" element={<PlaceholderPage title="Procurement" description="AI-assisted procurement recommendations" />} />
          <Route path="/gov/innovation-memory" element={<PlaceholderPage title="Innovation Memory" description="Institutional knowledge and lessons learned" />} />
          <Route path="/gov/reports" element={<PlaceholderPage title="Reports" description="Generate and view procurement reports" />} />
          <Route path="/gov/audit-logs" element={<PlaceholderPage title="Audit Logs" description="View system audit trail" />} />
          <Route path="/gov/settings" element={<PlaceholderPage title="Settings" description="Configure preferences and notifications" />} />
        </Route>
      </Route>

      {/* ── Startup Routes ─────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["STARTUP"]} />
        }
      >
        <Route element={<AppLayout />}>
          <Route path="/startup" element={<StartupDashboard />} />
          <Route path="/startup/profile" element={<PlaceholderPage title="My Profile" description="Manage your startup profile and capabilities" />} />
          <Route path="/startup/challenges" element={<PlaceholderPage title="Challenges" description="Browse open innovation challenges" />} />
          <Route path="/startup/proposals" element={<PlaceholderPage title="My Proposals" description="View and manage your submitted proposals" />} />
          <Route path="/startup/pilots" element={<PlaceholderPage title="My Pilots" description="Track your active pilot programs" />} />
          <Route path="/startup/feedback" element={<PlaceholderPage title="Feedback" description="View evaluation feedback on your proposals" />} />
          <Route path="/startup/notifications" element={<PlaceholderPage title="Notifications" description="View all notifications and alerts" />} />
        </Route>
      </Route>

      {/* ── Evaluator Routes ───────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["EVALUATOR"]} />
        }
      >
        <Route element={<AppLayout />}>
          <Route path="/evaluator" element={<EvaluatorDashboard />} />
          <Route path="/evaluator/evaluations" element={<PlaceholderPage title="Assigned Evaluations" description="Review and score assigned proposals" />} />
          <Route path="/evaluator/pilots" element={<PlaceholderPage title="Pilots" description="Monitor pilot programs under evaluation" />} />
          <Route path="/evaluator/validation" element={<PlaceholderPage title="Validation" description="Validate pilot outcomes and KPI achievements" />} />
        </Route>
      </Route>

      {/* ── Admin / Auditor Routes ─────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "AUDITOR"]} />
        }
      >
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<PlaceholderPage title="Users" description="Manage platform user accounts" />} />
          <Route path="/admin/departments" element={<PlaceholderPage title="Departments" description="Manage government departments" />} />
          <Route path="/admin/startups" element={<PlaceholderPage title="Startups" description="View registered startup profiles" />} />
          <Route path="/admin/challenges" element={<PlaceholderPage title="Challenges" description="Oversee all innovation challenges" />} />
          <Route path="/admin/audit-logs" element={<PlaceholderPage title="Audit Logs" description="Full system audit trail" />} />
          <Route path="/admin/reports" element={<PlaceholderPage title="Reports" description="Platform-wide reports and analytics" />} />
          <Route path="/admin/system-settings" element={<PlaceholderPage title="System Settings" description="Configure platform settings" />} />
        </Route>
      </Route>

      {/* ── Fallback Routes ────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-neutral-50">
            <h1 className="text-6xl font-bold text-neutral-300 mb-4">404</h1>
            <p className="text-lg text-neutral-600 mb-2">Page Not Found</p>
            <p className="text-sm text-neutral-400 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        }
      />
    </Routes>
  );
}
