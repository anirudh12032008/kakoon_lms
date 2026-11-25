import { BrandScreen } from "@/shared/ui/BrandMark";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Gate for authenticated-only routes. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <BrandScreen />;
  if (status === "guest") return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Gate for guest-only routes (login/register) - redirects authed users away. */
export function GuestOnlyRoute() {
  const { status } = useAuth();
  if (status === "loading") return <BrandScreen />;
  if (status === "authed") return <Navigate to="/courses" replace />;
  return <Outlet />;
}
