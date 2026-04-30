import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Plus, Search, Trash2, BadgeCheck, BadgeX, CalendarDays } from "lucide-react"
import DashboardLayout from "../../components/common/DashboardLayout"
import Modal from "../../components/common/Modal"
import api from "../../services/api"

const specializations = [
  "Cardiology",
  "Orthopedics",
  "Neurology",
  "Dermatology",
  "Pediatrics",
  "Gynecology",
  "ENT",
  "Ophthalmology",
  "General Physician",
]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function to12h(time24) {
  if (!time24) return ""
  const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10))
  const ap = hh >= 12 ? "PM" : "AM"
  let h12 = hh % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`
}

export default function ManageDoctors() {
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [q, setQ] = useState("")
  const [spec, setSpec] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "male",
    specialization: "General Physician",
    qualification: "",
    experience: 0,
    consultationFee: 0,
    bio: "",
    department: "",
    profileImage: "",
    isVerified: false,
  })

  const [schedule, setSchedule] = useState(
    days.reduce((acc, d) => {
      acc[d] = { enabled: false, start: "09:00", end: "17:00", duration: 30 }
      return acc
    }, {}),
  )

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/admin/doctors")
      setDoctors(data.doctors || [])
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load doctors")
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return doctors.filter((d) => {
      const name = d.user?.name || ""
      const okQ = !query || name.toLowerCase().includes(query)
      const okS = !spec || d.specialization === spec
      return okQ && okS
    })
  }, [doctors, q, spec])

  const availableSlots = useMemo(() => {
    const out = []
    for (const day of days) {
      const d = schedule[day]
      if (!d.enabled) continue
      out.push({
        day,
        startTime: to12h(d.start),
        endTime: to12h(d.end),
        slotDuration: Number(d.duration || 30),
        isAvailable: true,
      })
    }
    return out
  }, [schedule])

  const openAdd = () => {
    setEditing(null)
    setForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      gender: "male",
      specialization: "General Physician",
      qualification: "",
      experience: 0,
      consultationFee: 0,
      bio: "",
      department: "",
      profileImage: "",
      isVerified: false,
    })
    setSchedule(
      days.reduce((acc, d) => {
        acc[d] = { enabled: false, start: "09:00", end: "17:00", duration: 30 }
        return acc
      }, {}),
    )
    setModalOpen(true)
  }

  const openEdit = (doc) => {
    setEditing(doc)
    setForm({
      name: doc.user?.name || "",
      email: doc.user?.email || "",
      password: "",
      phone: doc.user?.phone || "",
      gender: doc.user?.gender || "male",
      specialization: doc.specialization || "General Physician",
      qualification: doc.qualification || "",
      experience: doc.experience || 0,
      consultationFee: doc.consultationFee || 0,
      bio: doc.bio || "",
      department: doc.department || "",
      profileImage: doc.user?.profileImage || "",
      isVerified: Boolean(doc.isVerified),
    })
    setModalOpen(true)
  }

  const submit = async () => {
    try {
      if (!form.name || !form.email || (!editing && !form.password)) {
        toast.error("Name, email, and password (for new doctor) are required")
        return
      }
      if (!/^\d{10}$/.test(String(form.phone || "").trim())) {
        toast.error("Phone number must be exactly 10 digits")
        return
      }

      const payload = {
        ...form,
        availableSlots,
      }

      if (!editing) {
        await api.post("/admin/doctors", payload)
        toast.success("Doctor created")
      } else {
        // update doctor + user via new endpoint
        await api.put(`/admin/doctors/${editing._id}`, payload)
        // schedule update separate (kept explicit)
        await api.put(`/admin/doctors/${editing._id}/schedule`, { availableSlots })
        toast.success("Doctor updated")
      }

      setModalOpen(false)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save doctor")
    }
  }

  const toggleVerify = async (doc) => {
    try {
      await api.patch(`/admin/doctors/${doc._id}/verify`)
      toast.success("Verification updated")
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update verification")
    }
  }

  const doDelete = async () => {
    try {
      await api.delete(`/admin/doctors/${confirmDelete._id}`)
      toast.success("Doctor deleted (soft)")
      setConfirmDelete(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete doctor")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-blue-600 px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-white">Manage Doctors</h1>
            <p className="mt-0.5 text-sm text-blue-100">Add, verify, schedule and manage doctors.</p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
          >
            <Plus className="h-4 w-4" />
            Add Doctor
          </button>
        </header>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 outline-none focus:border-blue-200"
                placeholder="Search by doctor name"
              />
            </div>
            <select
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-200"
            >
              <option value="">All Specializations</option>
              {specializations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4" colSpan={7}>
                      <div className="h-8 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-600" colSpan={7}>
                    No doctors found.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d._id}>
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-blue-50">
                        {d.user?.profileImage ? (
                          <img src={d.user.profileImage} alt={d.user?.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-semibold text-blue-600">
                            {(d.user?.name || "D").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{d.user?.name}</p>
                      <p className="text-xs text-gray-500">{d.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">{d.specialization}</td>
                    <td className="px-4 py-3">{d.experience || 0} yrs</td>
                    <td className="px-4 py-3">₹{d.consultationFee || 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          d.isVerified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {d.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(d)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVerify(d)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {d.isVerified ? <BadgeX className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                          {d.isVerified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          type="button"
                          onClick={() => toast("Schedule editing is inside Edit modal")}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <CalendarDays className="h-4 w-4" />
                          View Schedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(d)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={modalOpen}
          title={editing ? "Edit Doctor" : "Add Doctor"}
          onClose={() => setModalOpen(false)}
          size="xl"
        >
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Account</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Full Name</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder="Enter full name"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Email Address</span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder="Enter email"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">
                    {editing ? "New Password (Optional)" : "Password"}
                  </span>
                  <input
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder={editing ? "Leave blank to keep unchanged" : "Enter password"}
                    type="password"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Phone Number (10 digits)</span>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder="e.g. 9876543210"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Gender</span>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-200"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Profile Image URL</span>
                  <input
                    value={form.profileImage}
                    onChange={(e) => setForm((p) => ({ ...p, profileImage: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder="https://example.com/photo.jpg"
                  />
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">Professional</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Specialization</span>
                  <select
                    value={form.specialization}
                    onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-200"
                  >
                    {specializations.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Qualification</span>
                  <input
                    value={form.qualification}
                    onChange={(e) => setForm((p) => ({ ...p, qualification: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder="e.g. MBBS, MD"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Experience (Years)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.experience}
                    onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder="Enter years"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Consultation Fee (INR)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.consultationFee}
                    onChange={(e) => setForm((p) => ({ ...p, consultationFee: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder="Enter fee"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-700">Department</span>
                  <input
                    value={form.department}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                    placeholder="e.g. Outpatient"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => setForm((p) => ({ ...p, isVerified: e.target.checked }))}
                    className="accent-sky-500"
                  />
                  Verified
                </label>
              </div>
              <label className="mt-3 block space-y-1">
                <span className="text-xs font-medium text-gray-700">Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
                  rows={3}
                  placeholder="Short professional summary"
                />
              </label>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">Schedule</h3>
              <div className="mt-3 space-y-2">
                {days.map((day) => {
                  const d = schedule[day]
                  return (
                    <div key={day} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <input
                            type="checkbox"
                            checked={d.enabled}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], enabled: e.target.checked },
                              }))
                            }
                            className="accent-sky-500"
                          />
                          {day}
                        </label>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input
                            type="time"
                            value={d.start}
                            disabled={!d.enabled}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], start: e.target.value },
                              }))
                            }
                            className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm disabled:opacity-50"
                          />
                          <input
                            type="time"
                            value={d.end}
                            disabled={!d.enabled}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], end: e.target.value },
                              }))
                            }
                            className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm disabled:opacity-50"
                          />
                          <input
                            type="number"
                            min="10"
                            step="5"
                            value={d.duration}
                            disabled={!d.enabled}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], duration: e.target.value },
                              }))
                            }
                            className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-100 bg-white pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={Boolean(confirmDelete)}
          title="Delete Doctor"
          onClose={() => setConfirmDelete(null)}
        >
          <p className="text-sm text-gray-600">
            This will soft-delete the doctor (sets user inactive). Continue?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={doDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
            >
              Delete
            </button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

