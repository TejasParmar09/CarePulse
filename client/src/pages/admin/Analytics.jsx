import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import DashboardLayout from "../../components/common/DashboardLayout"
import api from "../../services/api"

function formatDayLabel(day) {
  return new Date(day).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

function rangeFromPreset(preset) {
  const end = new Date()
  const start = new Date()
  if (preset === "7d") start.setDate(end.getDate() - 6)
  if (preset === "30d") start.setDate(end.getDate() - 29)
  if (preset === "90d") start.setDate(end.getDate() - 89)
  return { start, end }
}

export default function Analytics() {
  const [preset, setPreset] = useState("30d")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [loading, setLoading] = useState(true)

  const [data, setData] = useState({
    revenueByDay: [],
    appointmentsByDepartment: [],
    doctorPerformance: [],
    patientGrowth: [],
  })

  const { from, to } = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(customTo) }
    }
    const r = rangeFromPreset(preset)
    return { from: r.start, to: r.end }
  }, [preset, customFrom, customTo])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get("/admin/analytics", {
          params: { from: from.toISOString(), to: to.toISOString() },
        })
        const analytics = res.data.analytics || {}
        if (!mounted) return
        setData(analytics)
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load analytics")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [from, to])

  const revenueSeries = useMemo(
    () => (data.revenueByDay || []).map((x) => ({ day: formatDayLabel(x.day), revenue: x.total })),
    [data.revenueByDay],
  )

  const growthSeries = useMemo(
    () => (data.patientGrowth || []).map((x) => ({ day: formatDayLabel(x.day), count: x.count })),
    [data.patientGrowth],
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
              <p className="mt-1 text-sm text-gray-600">Revenue, operational and growth insights.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {["7d", "30d", "90d", "custom"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    preset === p ? "bg-blue-50 text-blue-600" : "border border-gray-200 text-gray-700"
                  }`}
                >
                  {p === "custom" ? "Custom" : p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {preset === "custom" ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300"
              />
            </div>
          ) : null}
        </header>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#1a73e8" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Appointments per Department</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.appointmentsByDepartment || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a73e8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Hover bars to see department names and counts.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900">Doctor Performance</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Doctor</th>
                    <th className="px-4 py-3">Appointments</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(data.doctorPerformance || []).slice(0, 20).map((d) => (
                    <tr key={d.doctorId}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-500">{d.specialization}</p>
                      </td>
                      <td className="px-4 py-3">{d.totalAppointments}</td>
                      <td className="px-4 py-3">₹{d.revenue}</td>
                      <td className="px-4 py-3">{Number(d.rating || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                  {!loading && (data.doctorPerformance || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-600">
                        No data.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Patient Registration Growth</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#1a73e8" fill="#e8f0fe" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

