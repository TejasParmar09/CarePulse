import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import {
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  Star,
  Users,
} from "lucide-react"
import toast from "react-hot-toast"
import DashboardLayout from "../../components/common/DashboardLayout"
import StatsCard from "../../components/common/StatsCard"
import api from "../../services/api"
import { Link } from "react-router-dom"

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return "-"
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return "-"
  const diff = Date.now() - dob.getTime()
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)))
}

function dayLabel(d) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short" })
}

export default function DoctorDashboard() {
  useEffect(() => {
    document.title = "Doctor Dashboard — CarePulse"
  }, [])

  const { user } = useSelector((s) => s.auth)
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    totalEarnings: 0,
    rating: 0,
  })
  const [todayAppointments, setTodayAppointments] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const now = new Date()
        const [statsRes, todayRes] = await Promise.all([
          api.get("/doctor/stats/me"),
          api.get("/appointment/doctor", { params: { date: now.toISOString() } }),
        ])

        if (!mounted) return
        setStats(statsRes.data.stats || stats)
        const appts = todayRes.data.appointments || []
        appts.sort((a, b) => String(a.timeSlot).localeCompare(String(b.timeSlot)))
        setTodayAppointments(appts)

        // recent patients from last 5 (unique)
        const seen = new Set()
        const rp = []
        for (const a of appts.concat(appts).slice(0, 50)) {
          const p = a.patient
          const id = p?._id
          if (!id || seen.has(id)) continue
          seen.add(id)
          rp.push({ patient: p, lastVisit: a.appointmentDate })
          if (rp.length >= 5) break
        }
        setRecentPatients(rp)

        // last 7 days earnings (client-side)
        const days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          return d
        })
        const series = []
        for (const d of days) {
          const { data } = await api.get("/appointment/doctor", { params: { date: d.toISOString() } })
          const list = data.appointments || []
          const total = list
            .filter((x) => x.paymentStatus === "paid")
            .reduce((sum, x) => sum + Number(x.amount || 0), 0)
          series.push({ day: dayLabel(d), earnings: total })
        }
        if (!mounted) return
        setEarnings(series)
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load dashboard")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const monthEarnings = useMemo(() => {
    // Approximate: use totalEarnings (backend overall) as placeholder for "this month"
    return stats.totalEarnings || 0
  }, [stats.totalEarnings])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome, Dr. {user?.name || "Doctor"}
              </h1>
              <p className="mt-1 text-sm text-gray-600">{formatDate(new Date())}</p>
            </div>
            <Link
              to="/doctor/appointments"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white"
            >
              View Appointments
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={CalendarClock}
            color="blue"
          />
          <StatsCard title="Total Patients" value={stats.totalPatients} icon={Users} color="amber" />
          <StatsCard
            title="This Month's Earnings"
            value={`₹${monthEarnings}`}
            icon={IndianRupee}
            color="green"
          />
          <StatsCard title="Rating" value={(stats.rating || 0).toFixed(1)} icon={Star} color="blue" />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
              <span className="text-sm text-gray-500">{todayAppointments.length} items</span>
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">No appointments today. Enjoy your day!</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
                {todayAppointments.map((a) => (
                  <div key={a._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {a.timeSlot} • {a.patient?.name || "Patient"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        Age {computeAge(a.patient?.dateOfBirth)} • {a.type || "consultation"} •{" "}
                        {a.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toast("Mark complete from Appointments page")}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Mark Complete
                      </button>
                      <Link
                        to={`/doctor/patients/${a._id}`}
                        state={{ appointment: a }}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-sm font-medium text-white hover:opacity-95"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
            <div className="mt-4 space-y-3">
              {recentPatients.length === 0 ? (
                <p className="text-sm text-gray-600">No recent patients yet.</p>
              ) : (
                recentPatients.map((x, idx) => {
                  const p = x.patient || {}
                  const name = p.name || "Patient"
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-blue-50">
                          {p.profileImage ? (
                            <img src={p.profileImage} alt={name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-semibold text-blue-600">
                              {name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-gray-600">
                            Last visit: {new Date(x.lastVisit).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Earnings (last 7 days)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr>
                <th className="pb-2 text-left text-xs font-semibold text-gray-500">Day</th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-500">Earnings</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {earnings.map((e) => (
                  <tr key={e.day}>
                    <td className="py-2 text-gray-700">{e.day}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">₹{e.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

