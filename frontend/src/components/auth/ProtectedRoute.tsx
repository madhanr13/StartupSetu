/**
 * ProtectedRoute — route guard that checks authentication and role authorization.
 *
 * - Redirects to /login if not authenticated.
 * - Shows 403 page if user's role is not in allowedRoles.
 * - Renders <Outlet /> if authorized.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";
import LoadingState from "@/components/ui/LoadingState";
import { ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Still checking the stored token
  if (isLoading) {
    return <LoadingState variant="full" message="Verifying session..." />;
  }

  // Not authenticated → go to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check (if specified)
  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-neutral-50">
        <div className="p-4 rounded-full bg-danger-50 text-danger-500 mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Access Denied
        </h1>
        <p className="text-neutral-500 max-w-md mb-6">
          Your account role ({user.role}) does not have permission to access this
          section. Please contact your administrator if you believe this is an
          error.
        </p>
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
