import { useMemo, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import DashboardLayout from "../../components/common/DashboardLayout"
import api from "../../services/api"

function computeAge(dateOfBirth) {
  if (!dateOfBirth) return "-"
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return "-"
  return Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
}

const freqOptions = ["Once a day", "Twice a day", "Thrice a day", "SOS", "Weekly"]

export default function PatientDetails() {
  const { appointmentId } = useParams()
  const location = useLocation()
  const appointment = location.state?.appointment

  const patient = appointment?.patient || {}
  const doctor = appointment?.doctor || {}
  const [diagnosis, setDiagnosis] = useState("")
  const [advice, setAdvice] = useState("")
  const [rows, setRows] = useState([
    { name: "", dosage: "", frequency: "Once a day", duration: "", notes: "" },
  ])
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const canSave = useMemo(() => Boolean(appointment?._id && diagnosis.trim()), [appointment, diagnosis])

  const addRow = () =>
    setRows((r) => [...r, { name: "", dosage: "", frequency: "Once a day", duration: "", notes: "" }])
  const removeRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx))
  const updateRow = (idx, key, value) =>
    setRows((r) => r.map((x, i) => (i === idx ? { ...x, [key]: value } : x)))

  const savePrescription = async () => {
    if (!appointment?._id) {
      toast.error("Open this page from the Appointments list.")
      return
    }
    try {
      setSaving(true)
      const medicines = rows.filter((r) => r.name.trim())
      const fd = new FormData()
      fd.append("appointmentId", appointment._id)
      fd.append("diagnosis", diagnosis)
      fd.append("advice", advice)
      fd.append("medicines", JSON.stringify(medicines))
      if (file) fd.append("prescription", file)

      await api.post("/patient/prescriptions/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("Prescription saved")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save prescription")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h1 className="text-2xl font-semibold text-gray-900">Patient Details</h1>
          <p className="mt-1 text-sm text-gray-600">Appointment ID: {appointmentId}</p>
          {!appointment ? (
            <p className="mt-3 text-sm text-amber-700">
              Tip: open this page via “Upload Prescription” from the doctor appointments list so
              patient + appointment details are available.
            </p>
          ) : null}
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-900">Patient Info</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="font-medium">{patient.name || "-"}</span>
              </p>
              <p>
                <span className="text-gray-500">Age:</span>{" "}
                <span className="font-medium">{computeAge(patient.dateOfBirth)}</span>
              </p>
              <p>
                <span className="text-gray-500">Gender:</span>{" "}
                <span className="font-medium">{patient.gender || "-"}</span>
              </p>
              <p>
                <span className="text-gray-500">Blood Group:</span>{" "}
                <span className="font-medium">{patient.bloodGroup || "-"}</span>
              </p>
              <p>
                <span className="text-gray-500">Phone:</span>{" "}
                <span className="font-medium">{patient.phone || "-"}</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900">Current Appointment</h2>
            <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
              <p>
                <span className="text-gray-500">Type:</span>{" "}
                <span className="font-medium">{appointment?.type || "-"}</span>
              </p>
              <p>
                <span className="text-gray-500">Time:</span>{" "}
                <span className="font-medium">{appointment?.timeSlot || "-"}</span>
              </p>
            </div>
            <p className="mt-3 text-sm text-gray-700">
              <span className="text-gray-500">Symptoms:</span> {appointment?.symptoms || "-"}
            </p>

            <div className="mt-6">
              <h3 className="text-base font-semibold text-gray-900">Prescription</h3>

              <label className="mt-4 block text-sm font-medium text-gray-700">Diagnosis</label>
              <textarea
                rows={3}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                placeholder="Diagnosis / notes"
              />

              <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
                    <tr>
                      <th className="px-3 py-3">Medicine</th>
                      <th className="px-3 py-3">Dosage</th>
                      <th className="px-3 py-3">Frequency</th>
                      <th className="px-3 py-3">Duration</th>
                      <th className="px-3 py-3">Notes</th>
                      <th className="px-3 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.map((r, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="px-3 py-3">
                          <input
                            value={r.name}
                            onChange={(e) => updateRow(idx, "name", e.target.value)}
                            className="w-40 rounded-lg border border-gray-200 px-2 py-1.5 outline-none focus:border-blue-200"
                            placeholder="Name"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={r.dosage}
                            onChange={(e) => updateRow(idx, "dosage", e.target.value)}
                            className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 outline-none focus:border-blue-200"
                            placeholder="e.g. 500mg"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={r.frequency}
                            onChange={(e) => updateRow(idx, "frequency", e.target.value)}
                            className="w-36 rounded-lg border border-gray-200 px-2 py-1.5 outline-none focus:border-blue-200"
                          >
                            {freqOptions.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={r.duration}
                            onChange={(e) => updateRow(idx, "duration", e.target.value)}
                            className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 outline-none focus:border-blue-200"
                            placeholder="e.g. 5 days"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={r.notes}
                            onChange={(e) => updateRow(idx, "notes", e.target.value)}
                            className="w-44 rounded-lg border border-gray-200 px-2 py-1.5 outline-none focus:border-blue-200"
                            placeholder="Optional"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            disabled={rows.length === 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addRow}
                className="mt-3 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add Row
              </button>

              <label className="mt-5 block text-sm font-medium text-gray-700">Advice</label>
              <textarea
                rows={3}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                placeholder="Advice / follow-ups"
              />

              <label className="mt-5 block text-sm font-medium text-gray-700">
                Upload prescription (PDF/image)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />

              <button
                type="button"
                disabled={!canSave || saving}
                onClick={savePrescription}
                className="mt-5 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Prescription"}
              </button>

              <p className="mt-3 text-xs text-gray-500">
                This will upload to Cloudinary and mark the appointment as completed on the server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

