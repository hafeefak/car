import { Navigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { useAuth } from "../auth/AuthProvider";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-screen">Checking authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
