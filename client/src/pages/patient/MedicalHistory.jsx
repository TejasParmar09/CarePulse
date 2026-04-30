import { useEffect, useMemo, useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Search, Stethoscope } from "lucide-react"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import DashboardLayout from "../../components/common/DashboardLayout"
import api from "../../services/api"

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function MedicalHistory() {
  useEffect(() => {
    document.title = "Medical History — CarePulse"
  }, [])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const { data } = await api.get("/patient/medical-history")
        if (mounted) setItems(data.appointments || [])
      } catch (err) {
        toast.error(err.normalizedMessage || err.response?.data?.message || "Failed to load history")
        if (mounted) setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((a) => {
      const doctorName = a.doctor?.user?.name || ""
      const spec = a.doctor?.specialization || ""
      const dt = new Date(a.appointmentDate)
      const matchQuery =
        !query ||
        doctorName.toLowerCase().includes(query) ||
        spec.toLowerCase().includes(query)
      const matchFrom = !from || dt >= new Date(from.setHours(0, 0, 0, 0))
      const matchTo = !to || dt <= new Date(to.setHours(23, 59, 59, 999))
      return matchQuery && matchFrom && matchTo
    })
  }, [items, q, from, to])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h1 className="text-2xl font-semibold text-gray-900">Medical History</h1>
          <p className="mt-1 text-sm text-gray-600">
            Completed appointments and prescriptions in one place.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by doctor or specialization"
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 outline-none focus:border-blue-200"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
              <DatePicker
                selected={from}
                onChange={(d) => setFrom(d)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                placeholderText="From date"
                isClearable
              />
              <DatePicker
                selected={to}
                onChange={(d) => setTo(d)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                placeholderText="To date"
                isClearable
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto inline-flex rounded-2xl bg-blue-50 p-4 text-blue-600">
              <Stethoscope className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              No medical history yet
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Once you complete appointments, prescriptions will appear here.
            </p>
            <Link
              to="/doctors"
              className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white"
            >
              Book Appointment
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
            <ol className="relative ml-3 border-l border-gray-100">
              {filtered.map((a) => {
                const docName = a.doctor?.user?.name || "Doctor"
                const spec = a.doctor?.specialization || "General"
                const pres = a.prescription
                return (
                  <li key={a._id} className="mb-8 ml-6">
                    <span className="absolute -left-2 mt-1.5 h-3 w-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700" />
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(a.appointmentDate)}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-blue-600">{docName}</span> • {spec}
                        </p>
                      </div>
                      {pres?.fileUrl ? (
                        <button
                          type="button"
                          onClick={() => window.open(pres.fileUrl, "_blank", "noopener,noreferrer")}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Download Prescription
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-900">Diagnosis</p>
                      <p className="mt-1 text-sm text-gray-700">{pres?.diagnosis || "-"}</p>

                      <p className="mt-3 text-sm font-medium text-gray-900">Medicines</p>
                      {Array.isArray(pres?.medicines) && pres.medicines.length ? (
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700">
                          {pres.medicines.slice(0, 8).map((m, idx) => (
                            <li key={idx}>
                              {m.name}
                              {m.dosage ? ` — ${m.dosage}` : ""}{" "}
                              {m.frequency ? `(${m.frequency})` : ""}{" "}
                              {m.duration ? `• ${m.duration}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-gray-700">-</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

