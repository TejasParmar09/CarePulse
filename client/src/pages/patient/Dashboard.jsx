import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  History,
  Pill,
  Plus,
  Stethoscope,
} from "lucide-react"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"
import DashboardLayout from "../../components/common/DashboardLayout"
import StatsCard from "../../components/common/StatsCard"
import AppointmentCard from "../../components/patient/AppointmentCard"
import api from "../../services/api"

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
}

const statusDotColor = {
  confirmed: "bg-blue-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-400",
  pending: "bg-amber-400",
  rescheduled: "bg-indigo-400",
}

export default function Dashboard() {
  useEffect(() => { document.title = "Patient Dashboard — CarePulse" }, [])

  const { user } = useSelector((s) => s.auth)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const { data } = await api.get("/appointment/patient")
        if (mounted) setAppointments(data.appointments || [])
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load appointments")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    return {
      total: appointments.length,
      upcoming: appointments.filter((a) =>
        (a.status === "confirmed" || a.status === "pending") && new Date(a.appointmentDate) >= now
      ).length,
      completed: appointments.filter((a) => a.status === "completed").length,
      pendingPayment: appointments.filter((a) => a.paymentStatus === "pending").length,
    }
  }, [appointments])

  const upcomingTwo = useMemo(() => {
    const now = new Date()
    return appointments
      .filter((a) => (a.status === "confirmed" || a.status === "pending") && new Date(a.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
      .slice(0, 2)
  }, [appointments])

  const recentFive = useMemo(() => appointments.slice(0, 5), [appointments])

  const Skeleton = ({ h = "h-28" }) => (
    <div className={`${h} animate-pulse rounded-2xl bg-gray-100`} />
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Welcome Header ─────────────────────────────────── */}
        <header className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/70">{formatDate(new Date())}</p>
              <h1 className="mt-1 text-2xl font-extrabold">
                Welcome back, {user?.name?.split(" ")[0] || "Patient"} 👋
              </h1>
              <p className="mt-1 text-sm text-white/70">Here's your health overview for today.</p>
            </div>
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-600 shadow-sm transition hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              Book Appointment
            </Link>
          </div>
        </header>

        {/* ── Stats ──────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
            : (
              <>
                <StatsCard title="Total Appointments" value={stats.total} icon={ClipboardList} color="blue" />
                <StatsCard title="Upcoming" value={stats.upcoming} icon={CalendarClock} color="amber" />
                <StatsCard title="Completed" value={stats.completed} icon={CalendarCheck2} color="green" />
                <StatsCard title="Pending Payment" value={stats.pendingPayment} icon={CircleDollarSign} color="red" />
              </>
            )
          }
        </section>

        {/* ── Upcoming + Quick Actions ────────────────────────── */}
        <section className="grid gap-6 xl:grid-cols-3">
          {/* Upcoming Appointments */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Appointments</h2>
              <Link
                to="/patient/appointments"
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton h="h-40" /><Skeleton h="h-40" />
              </div>
            ) : upcomingTwo.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
                <CalendarClock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">No upcoming appointments</p>
                <p className="mt-1 text-xs text-gray-400">Book your next visit in a few clicks.</p>
                <Link
                  to="/doctors"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                >
                  <Plus className="h-4 w-4" /> Book Now
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcomingTwo.map((appt) => (
                  <AppointmentCard
                    key={appt._id}
                    appointment={appt}
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => toast("Cancel from My Appointments page")}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <Link
                          to="/patient/appointments"
                          className="rounded-xl bg-gradient-to-r bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:opacity-90"
                        >
                          Reschedule
                        </Link>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/doctors"
                className="flex items-center justify-between rounded-2xl bg-gradient-to-r bg-blue-600 px-4 py-4 text-white shadow-md transition hover:opacity-90"
              >
                <div>
                  <p className="text-xs font-medium text-white/70">Ready to consult?</p>
                  <p className="text-base font-bold">Book Appointment</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Stethoscope className="h-5 w-5" />
                </div>
              </Link>

              {[
                { to: "/patient/appointments", icon: Activity, label: "My Appointments", sub: "View & manage" },
                { to: "/patient/history", icon: History, label: "Medical History", sub: "Past records" },
                { to: "/patient/history", icon: Pill, label: "My Prescriptions", sub: "Digital prescriptions" },
              ].map(({ to, icon: Icon, label, sub }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:border-sky-200 hover:bg-blue-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Icon className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Recent Activity Timeline ────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <Link
              to="/patient/appointments"
              className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              All appointments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : recentFive.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Activity className="mx-auto mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-500">No recent activity yet.</p>
            </div>
          ) : (
            <ol className="relative ml-4 border-l-2 border-gray-100">
              {recentFive.map((a, idx) => {
                const dotColor = statusDotColor[a.status] || "bg-gray-300"
                return (
                  <li key={a._id} className={`mb-5 ml-6 ${idx === recentFive.length - 1 ? "mb-0" : ""}`}>
                    <span className={`absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white ${dotColor}`} />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Appointment{" "}
                          <span className="capitalize">{a.status}</span>{" "}
                          with{" "}
                          <span className="text-blue-600">{a.doctor?.user?.name || "Doctor"}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {a.timeSlot} · {a.doctor?.specialization || "General"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(a.appointmentDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
