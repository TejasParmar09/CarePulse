import { useEffect, useMemo, useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { ClipboardPlus, History, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"
import DashboardLayout from "../../components/common/DashboardLayout"
import api from "../../services/api"

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return "-"
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return "-"
  return Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
}

function StatusBadge({ status }) {
  const s = status || "pending"
  const map = {
    confirmed: "bg-blue-50 text-blue-600",
    completed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
    pending: "bg-amber-50 text-amber-700",
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${map[s] || map.pending}`}>
      {s}
    </span>
  )
}

export default function DoctorAppointments() {
  const [date, setDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])

  const load = async (d) => {
    try {
      setLoading(true)
      const { data } = await api.get("/appointment/doctor", { params: { date: d.toISOString() } })
      const list = data.appointments || []
      list.sort((a, b) => String(a.timeSlot).localeCompare(String(b.timeSlot)))
      setAppointments(list)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load appointments")
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const todayTitle = useMemo(
    () =>
      date.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [date],
  )

  const markCompleted = async (appt) => {
    try {
      await api.patch(`/appointment/${appt._id}/status`, { status: "completed" })
      toast.success("Marked completed")
      await load(date)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
              <p className="mt-1 text-sm text-gray-600">{todayTitle}</p>
            </div>
            <div className="w-full sm:w-72">
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-900">No appointments for this date</p>
            <p className="mt-1 text-sm text-gray-600">Pick another date to view the schedule.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {appointments.map((a) => {
              const p = a.patient || {}
              const name = p.name || "Patient"
              return (
                <div
                  key={a._id}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-full bg-blue-50">
                        {p.profileImage ? (
                          <img src={p.profileImage} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-semibold text-blue-600">
                            {name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{name}</p>
                        <p className="text-sm text-gray-600">
                          Age {computeAge(p.dateOfBirth)} • {p.gender || "-"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    <p>
                      <span className="text-gray-500">Time:</span>{" "}
                      <span className="font-medium">{a.timeSlot}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">Type:</span>{" "}
                      <span className="font-medium">{a.type || "consultation"}</span>
                    </p>
                  </div>

                  <p className="mt-3 text-sm text-gray-700">
                    <span className="text-gray-500">Symptoms:</span> {a.symptoms || "-"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => markCompleted(a)}
                      disabled={a.status === "completed"}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Completed
                    </button>

                    <Link
                      to={`/doctor/patients/${a._id}`}
                      state={{ appointment: a }}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ClipboardPlus className="h-4 w-4" />
                      Upload Prescription
                    </Link>

                    <button
                      type="button"
                      onClick={() => toast("Patient history view coming soon")}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <History className="h-4 w-4" />
                      View History
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

