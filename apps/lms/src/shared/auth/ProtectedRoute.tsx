import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-page">
      <div className="flex items-center gap-3">
        <span className="text-2xl"></span>
        <span className="text-lg font-bold text-primary-c">Kokoon</span>
      </div>
      <span className="loading loading-spinner loading-md text-primary-c" />
    </div>
  );
}

/** Gate for authenticated-only routes. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenLoader />;
  if (status === "guest") return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Gate for guest-only routes (login/register) — redirects authed users away. */
export function GuestOnlyRoute() {
  const { status } = useAuth();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "authed") return <Navigate to="/courses" replace />;
  return <Outlet />;
}
