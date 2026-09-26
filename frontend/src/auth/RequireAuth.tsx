import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Constructor y progreso exigen cuenta (decisión MVP). */
export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="text-sm text-muted">Cargando sesión…</p>;
  if (!user) return <Navigate to="/cuenta" replace state={{ from: location.pathname }} />;
  return children;
}
