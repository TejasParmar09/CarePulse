import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { useSelector } from "react-redux"
import DashboardLayout from "../../components/common/DashboardLayout"
import api from "../../services/api"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function to12h(time24) {
  if (!time24) return ""
  const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10))
  const ap = hh >= 12 ? "PM" : "AM"
  let h12 = hh % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${String(mm).padStart(2, "0")} ${ap}`
}

function to24h(time12) {
  if (!time12) return ""
  const s = time12.trim().toUpperCase()
  const match = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (!match) return ""
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const ap = match[3]
  if (ap === "PM" && h !== 12) h += 12
  if (ap === "AM" && h === 12) h = 0
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export default function DoctorProfile() {
  const { user } = useSelector((s) => s.auth)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [profileImage, setProfileImage] = useState(user?.profileImage || "")
  const [bio, setBio] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [qualification, setQualification] = useState("")
  const [experience, setExperience] = useState("")
  const [consultationFee, setConsultationFee] = useState("")

  const [schedule, setSchedule] = useState(
    days.reduce((acc, d) => {
      acc[d] = { enabled: false, start: "09:00", end: "17:00", duration: 30 }
      return acc
    }, {}),
  )

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/doctor/${user?.doctor?.id || ""}`).catch(() => ({ data: {} }))
        const doc = data.doctor
        if (doc) {
          setBio(doc.bio || "")
          setSpecialization(doc.specialization || "")
          setQualification(doc.qualification || "")
          setExperience(doc.experience ?? "")
          setConsultationFee(doc.consultationFee ?? "")
          if (Array.isArray(doc.availableSlots)) {
            setSchedule((prev) => {
              const next = { ...prev }
              for (const s of doc.availableSlots) {
                if (!next[s.day]) continue
                next[s.day] = {
                  enabled: s.isAvailable !== false,
                  start: to24h(s.startTime),
                  end: to24h(s.endTime),
                  duration: s.slotDuration || 30,
                }
              }
              return next
            })
          }
        }
      } catch (_err) {
        // ignore for now
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (user?._id || user?.id) load()
    return () => {
      mounted = false
    }
  }, [user])

  const availableSlotsPayload = useMemo(() => {
    const slots = []
    for (const day of days) {
      const d = schedule[day]
      if (!d?.enabled) continue
      slots.push({
        day,
        startTime: to12h(d.start),
        endTime: to12h(d.end),
        slotDuration: Number(d.duration || 30),
        isAvailable: true,
      })
    }
    return slots
  }, [schedule])

  const saveAll = async () => {
    try {
      setSaving(true)
      // update user profile image (auth endpoint)
      if (profileImage !== (user?.profileImage || "")) {
        await api.put("/auth/update-profile", { profileImage })
      }
      // update doctor core fields
      await api.put("/doctor/profile", {
        bio,
        experience: Number(experience || 0),
        consultationFee: Number(consultationFee || 0),
        qualifications: qualification,
        specialization, // may be ignored by backend; kept for future expansion
      })
      // update availability
      await api.put("/doctor/availability", { availableSlots: availableSlotsPayload })

      toast.success("Profile updated")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h1 className="text-2xl font-semibold text-gray-900">Doctor Profile</h1>
          <p className="mt-1 text-sm text-gray-600">Update your professional profile and availability.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-900">Profile Photo</h2>
            <p className="mt-1 text-sm text-gray-600">
              Paste an image URL (upload integration can be added next).
            </p>
            <input
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-200"
              placeholder="https://..."
            />
            <div className="mt-4 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-blue-50">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-semibold text-blue-600">
                    {(user?.name || "D").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name || "Doctor"}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role || "doctor"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900">Professional Details</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Specialization</label>
                <input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Qualification</label>
                <input
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Consultation Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                placeholder="Short professional bio"
              />
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">Availability Schedule</h3>
              <p className="mt-1 text-sm text-gray-600">
                Select days and set start/end times and slot duration.
              </p>

              <div className="mt-4 space-y-3">
                {days.map((day) => {
                  const d = schedule[day]
                  return (
                    <div key={day} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
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

                        <div className="grid gap-3 sm:grid-cols-3">
                          <input
                            type="time"
                            value={d.start}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], start: e.target.value },
                              }))
                            }
                            disabled={!d.enabled}
                            className="w-36 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                          />
                          <input
                            type="time"
                            value={d.end}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], end: e.target.value },
                              }))
                            }
                            disabled={!d.enabled}
                            className="w-36 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                          />
                          <input
                            type="number"
                            min="10"
                            step="5"
                            value={d.duration}
                            onChange={(e) =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day]: { ...prev[day], duration: e.target.value },
                              }))
                            }
                            disabled={!d.enabled}
                            className="w-36 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                            placeholder="Duration"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={saving || loading}
              onClick={saveAll}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

