import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"

const roleDashboard = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
}

export default function ProtectedRoute({ role }) {
  const location = useLocation()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && user?.role !== role) {
    const redirectTo = roleDashboard[user?.role] || "/"
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
