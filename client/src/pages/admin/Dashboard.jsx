import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { CalendarClock, CreditCard, IndianRupee, Stethoscope, Users } from "lucide-react"
import DashboardLayout from "../../components/common/DashboardLayout"
import StatsCard from "../../components/common/StatsCard"
import api from "../../services/api"

const statusBadge = {
  pending:     "badge-amber",
  confirmed:   "badge-blue",
  completed:   "badge-green",
  cancelled:   "badge-red",
  rescheduled: "badge-blue",
  expired:     "badge-red",
}

function startOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 0, 0, 0, 0)
}
function endOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999)
}

export default function AdminDashboard() {
  useEffect(() => { document.title = "Admin Dashboard — CarePulse" }, [])

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    totalRevenue: 0,
    appointmentsByStatus: [],
    statusCounts: {},
    paymentCounts: {},
  })
  const [recentAppointments, setRecentAppointments] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const [{ data: statsRes }, { data: apptRes }, { data: patientsRes }] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/appointments", { params: { limit: 10, page: 1 } }),
          api.get("/admin/patients", { params: { limit: "all", page: 1 } }),
        ])
        if (!mounted) return
        setStats(statsRes.stats || {})
        setRecentAppointments(apptRes.appointments || [])
        setRecentPatients(patientsRes.patients || [])
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load dashboard")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const statusSummary = useMemo(() => {
    const map = stats.statusCounts || {}
    return ["pending", "confirmed", "completed", "cancelled", "expired"].map((k) => ({
      status: k,
      count: map[k] || 0,
    }))
  }, [stats.statusCounts])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <header className="rounded-xl bg-blue-600 px-6 py-5">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-blue-100">System overview and recent activity</p>
        </header>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard title="Total Patients" value={stats.totalPatients} icon={Users} color="blue" />
          <StatsCard title="Total Doctors" value={stats.totalDoctors} icon={Stethoscope} color="amber" />
          <StatsCard title="Today's Appointments" value={stats.todayAppointments} icon={CalendarClock} color="green" />
          <StatsCard title="Total Revenue" value={`₹${stats.totalRevenue || 0}`} icon={IndianRupee} color="green" />
        </section>

        {/* Status summary */}
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {statusSummary.map((s) => (
            <div key={s.status} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <p className="text-xs font-medium text-gray-500 capitalize">{s.status} Appointments</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{s.count}</p>
            </div>
          ))}
        </section>

        {/* Payment summary */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard
            title="Pending Payments"
            value={stats.paymentCounts?.pending || 0}
            icon={CreditCard}
            color="amber"
          />
          <StatsCard
            title="Paid Appointments"
            value={stats.paymentCounts?.paid || 0}
            icon={CreditCard}
            color="green"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Recent appointments */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-card xl:col-span-2">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Appointments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Patient","Doctor","Date","Status","Amount"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100" /></td></tr>
                    ))
                  ) : recentAppointments.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">No appointments yet.</td></tr>
                  ) : (
                    recentAppointments.map((a) => (
                      <tr key={a._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{a.patient?.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{a.doctor?.user?.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(a.appointmentDate).toLocaleDateString("en-IN")} · {a.timeSlot}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge[a.status] || "badge-gray"}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">₹{a.amount || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent patients */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-card">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Patients</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-gray-100" /></div>
                ))
              ) : recentPatients.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">No patients found.</p>
              ) : (
                recentPatients.map((p) => (
                  <div key={p._id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {(p.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{p.name || "—"}</p>
                        <p className="truncate text-xs text-gray-500">{p.email || "—"}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
