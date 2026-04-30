import { useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { Activity, CalendarDays, Home, LogOut, Menu, User, Users, X } from "lucide-react"
import { logout } from "../../store/authSlice"

const linksByRole = {
  patient: [
    { to: "/patient/dashboard", label: "Dashboard", icon: Home },
    { to: "/patient/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/patient/history", label: "Medical History", icon: Activity },
  ],
  doctor: [
    { to: "/doctor/dashboard", label: "Dashboard", icon: Home },
    { to: "/doctor/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/doctor/profile", label: "My Profile", icon: User },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: Home },
    { to: "/admin/doctors", label: "Doctors", icon: Users },
    { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  ],
}

function SidebarContent({ role, user, onLogout, onNavigate }) {
  const links = linksByRole[role] || []
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <Link to="/" onClick={onNavigate} className="text-lg font-bold text-gray-900">
          Care<span className="text-blue-600">Pulse</span>
        </Link>
      </div>

      {/* User card */}
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{user?.name || "User"}</p>
            <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "nav-active"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 px-3 py-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const role = useMemo(() => user?.role || "patient", [user?.role])

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 top-4 z-40 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-60 border-r border-gray-100 shadow-sm md:block">
        <SidebarContent role={role} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-60 border-r border-gray-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              role={role}
              user={user}
              onLogout={handleLogout}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  )
}
