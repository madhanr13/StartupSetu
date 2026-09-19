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

// Challenge Management pages
import ChallengeListPage from "@/pages/challenges/ChallengeListPage";
import ChallengeCreatePage from "@/pages/challenges/ChallengeCreatePage";
import ChallengeDetailPage from "@/pages/challenges/ChallengeDetailPage";

// Startup Directory & AI Discovery pages
import StartupListPage from "@/pages/startups/StartupListPage";
import StartupDetailPage from "@/pages/startups/StartupDetailPage";
import FindStartupsPage from "@/pages/challenges/FindStartupsPage";

// Proposal Management pages
import { ProposalSubmitPage } from "@/pages/proposals/ProposalSubmitPage";
import { ProposalListPage } from "@/pages/proposals/ProposalListPage";
import { ProposalDetailPage } from "@/pages/proposals/ProposalDetailPage";
import { ProposalEvaluatePage } from "@/pages/proposals/ProposalEvaluatePage";

// Pilot Management pages
import { PilotListPage } from "@/pages/pilots/PilotListPage";
import { PilotCreatePage } from "@/pages/pilots/PilotCreatePage";
import { PilotDetailPage } from "@/pages/pilots/PilotDetailPage";
import ProcurementDecisionPage from "@/pages/pilots/ProcurementDecisionPage";
import ProcurementScaleUpPage from "@/pages/procurement/ProcurementScaleUpPage";
import AnalyticsDashboardPage from "@/pages/analytics/AnalyticsDashboardPage";
import AuditLogPage from "@/pages/audit/AuditLogPage";
import InnovationMemoryPage from "@/pages/memory/InnovationMemoryPage";
import InnovationMemoryDetailPage from "@/pages/memory/InnovationMemoryDetailPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import SimulationPage from "@/pages/simulation/SimulationPage";

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
          <Route path="/gov/dashboard" element={<GovDashboard />} />
          <Route path="/gov/challenges" element={<ChallengeListPage />} />
          <Route path="/gov/challenges/new" element={<ChallengeCreatePage />} />
          <Route path="/gov/challenges/:id" element={<ChallengeDetailPage />} />
          <Route path="/gov/challenges/:id/startups" element={<FindStartupsPage />} />
          <Route path="/gov/startups" element={<StartupListPage />} />
          <Route path="/gov/startups/:id" element={<StartupDetailPage />} />
          <Route path="/gov/startup-discovery" element={<StartupListPage />} />
          <Route path="/gov/proposals" element={<ProposalListPage />} />
          <Route path="/gov/proposals/:id" element={<ProposalDetailPage />} />
          <Route path="/gov/proposals/:id/evaluate" element={<ProposalEvaluatePage />} />
          <Route path="/gov/pilots" element={<PilotListPage />} />
          <Route path="/gov/pilots/:id" element={<PilotDetailPage />} />
          <Route path="/gov/pilots/:id/decision" element={<ProcurementDecisionPage />} />
          <Route path="/gov/analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/gov/kpi-analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/gov/simulation" element={<SimulationPage />} />
          <Route path="/gov/procurement" element={<ProcurementScaleUpPage />} />
          <Route path="/gov/procurement/scale-up" element={<ProcurementScaleUpPage />} />
          <Route path="/gov/innovation-memory" element={<InnovationMemoryPage />} />
          <Route path="/gov/innovation-memory/:id" element={<InnovationMemoryDetailPage />} />
          <Route path="/gov/reports" element={<AnalyticsDashboardPage />} />
          <Route path="/gov/audit-logs" element={<AuditLogPage />} />
          <Route path="/gov/settings" element={<SettingsPage />} />
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
          <Route path="/startup/dashboard" element={<StartupDashboard />} />
          <Route path="/startup/profile" element={<StartupDetailPage />} />
          <Route path="/startup/startups" element={<StartupListPage />} />
          <Route path="/startup/startups/:id" element={<StartupDetailPage />} />
          <Route path="/startup/challenges" element={<ChallengeListPage />} />
          <Route path="/startup/challenges/:id" element={<ChallengeDetailPage />} />
          <Route path="/startup/challenges/:id/submit-proposal" element={<ProposalSubmitPage />} />
          <Route path="/challenges/:id/submit-proposal" element={<ProposalSubmitPage />} />
          <Route path="/startup/proposals" element={<ProposalListPage />} />
          <Route path="/startup/proposals/:id" element={<ProposalDetailPage />} />
          <Route path="/startup/pilots" element={<PilotListPage />} />
          <Route path="/startup/pilots/:id" element={<PilotDetailPage />} />
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
          <Route path="/evaluator/dashboard" element={<EvaluatorDashboard />} />
          <Route path="/evaluator/challenges" element={<ChallengeListPage />} />
          <Route path="/evaluator/challenges/:id" element={<ChallengeDetailPage />} />
          <Route path="/evaluator/startups" element={<StartupListPage />} />
          <Route path="/evaluator/startups/:id" element={<StartupDetailPage />} />
          <Route path="/evaluator/evaluations" element={<ProposalListPage />} />
          <Route path="/evaluator/proposals/:id" element={<ProposalDetailPage />} />
          <Route path="/evaluator/proposals/:id/evaluate" element={<ProposalEvaluatePage />} />
          <Route path="/evaluator/pilots" element={<PilotListPage />} />
          <Route path="/evaluator/pilots/:id" element={<PilotDetailPage />} />
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
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<PlaceholderPage title="Users" description="Manage platform user accounts" />} />
          <Route path="/admin/departments" element={<PlaceholderPage title="Departments" description="Manage government departments" />} />
          <Route path="/admin/startups" element={<StartupListPage />} />
          <Route path="/admin/startups/:id" element={<StartupDetailPage />} />
          <Route path="/admin/challenges" element={<ChallengeListPage />} />
          <Route path="/admin/challenges/:id" element={<ChallengeDetailPage />} />
          <Route path="/admin/pilots" element={<PilotListPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogPage />} />
          <Route path="/admin/reports" element={<AnalyticsDashboardPage />} />
          <Route path="/admin/analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/admin/simulation" element={<SimulationPage />} />
          <Route path="/admin/system-settings" element={<SettingsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* ── Generic Authenticated Routes ───────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={["GOVERNMENT_OFFICER", "STARTUP", "EVALUATOR", "ADMIN", "AUDITOR"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/proposals" element={<ProposalListPage />} />
          <Route path="/proposals/:id" element={<ProposalDetailPage />} />
          <Route path="/proposals/:id/evaluate" element={<ProposalEvaluatePage />} />
          <Route path="/proposals/:proposalId/create-pilot" element={<PilotCreatePage />} />
          <Route path="/pilots" element={<PilotListPage />} />
          <Route path="/pilots/:id" element={<PilotDetailPage />} />
          <Route path="/pilots/:id/decision" element={<ProcurementDecisionPage />} />
          <Route path="/procurement" element={<ProcurementScaleUpPage />} />
          <Route path="/procurement/scale-up" element={<ProcurementScaleUpPage />} />
          <Route path="/analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/kpi-analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/challenges/:id/submit-proposal" element={<ProposalSubmitPage />} />
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
