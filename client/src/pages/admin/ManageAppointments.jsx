import { useEffect, useMemo, useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import toast from "react-hot-toast"
import { Search } from "lucide-react"
import DashboardLayout from "../../components/common/DashboardLayout"
import api from "../../services/api"
import Modal from "../../components/common/Modal"

const statusOptions = ["", "pending", "confirmed", "completed", "cancelled", "rescheduled"]

function formatDateTime(a) {
  return `${new Date(a.appointmentDate).toLocaleDateString("en-IN")} ${a.timeSlot || ""}`
}

export default function ManageAppointments() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })

  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [status, setStatus] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [search, setSearch] = useState("")
  const [doctors, setDoctors] = useState([])

  const [statusModal, setStatusModal] = useState(null)
  const [newStatus, setNewStatus] = useState("confirmed")

  const loadDoctors = async () => {
    try {
      const { data } = await api.get("/admin/doctors")
      setDoctors(data.doctors || [])
    } catch (_err) {
      setDoctors([])
    }
  }

  const load = async (page = 1) => {
    try {
      setLoading(true)
      // backend supports single "date" filter; for range we fetch by pages and client-filter
      const params = { page, limit: pagination.limit }
      if (status) params.status = status
      if (doctorId) params.doctor = doctorId
      const { data } = await api.get("/admin/appointments", { params })
      setAppointments(data.appointments || [])
      setPagination(data.pagination || pagination)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load appointments")
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, doctorId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return appointments.filter((a) => {
      const patientName = a.patient?.name || ""
      const matchesName = !q || patientName.toLowerCase().includes(q)
      const dt = new Date(a.appointmentDate)
      const okFrom = !from || dt >= new Date(from.setHours(0, 0, 0, 0))
      const okTo = !to || dt <= new Date(to.setHours(23, 59, 59, 999))
      return matchesName && okFrom && okTo
    })
  }, [appointments, search, from, to])

  const openStatus = (a) => {
    setStatusModal(a)
    setNewStatus(a.status || "confirmed")
  }

  const applyStatus = async () => {
    try {
      const appt = statusModal
      if (!appt) return
      // admin status endpoint exists in appointmentController (doctor/admin)
      await api.patch(`/appointment/${appt._id}/status`, { status: newStatus })
      toast.success("Status updated")
      setStatusModal(null)
      await load(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-xl bg-blue-600 px-6 py-5">
          <h1 className="text-xl font-bold text-white">Manage Appointments</h1>
          <p className="mt-1 text-sm text-gray-600">Filter, review, and update appointment statuses.</p>
        </header>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 outline-none focus:border-blue-200"
                placeholder="Search by patient name"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-200"
            >
              <option value="">All Status</option>
              {statusOptions
                .filter((x) => x)
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-200"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.user?.name} — {d.specialization}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <DatePicker
              selected={from}
              onChange={(d) => setFrom(d)}
              placeholderText="From date"
              isClearable
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
            />
            <DatePicker
              selected={to}
              onChange={(d) => setTo(d)}
              placeholderText="To date"
              isClearable
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Date/Time</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4" colSpan={8}>
                      <div className="h-8 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-600" colSpan={8}>
                    No appointments found.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a._id}>
                    <td className="px-4 py-3 font-mono text-xs">{a._id.slice(-8)}</td>
                    <td className="px-4 py-3">{a.patient?.name || "-"}</td>
                    <td className="px-4 py-3">{a.doctor?.user?.name || "-"}</td>
                    <td className="px-4 py-3">{formatDateTime(a)}</td>
                    <td className="px-4 py-3">{a.type || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">₹{a.amount || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openStatus(a)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Change status
                        </button>
                        <button
                          type="button"
                          onClick={() => openStatus({ ...a, status: "cancelled" })}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages} • Total {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => load(pagination.page - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.pages}
              onClick={() => load(pagination.page + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <Modal
          isOpen={Boolean(statusModal)}
          title="Update Status"
          onClose={() => setStatusModal(null)}
        >
          <p className="text-sm text-gray-600">Select a new status for this appointment.</p>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-200"
          >
            {statusOptions
              .filter((x) => x)
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStatusModal(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Close
            </button>
            <button
              type="button"
              onClick={applyStatus}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white"
            >
              Apply
            </button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

