import { useEffect, useMemo, useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { CalendarDays, CreditCard, Star } from "lucide-react"
import toast from "react-hot-toast"
import api from "../../services/api"
import DashboardLayout from "../../components/common/DashboardLayout"
import AppointmentCard from "../../components/patient/AppointmentCard"
import Modal from "../../components/common/Modal"
import { Link } from "react-router-dom"

const tabs = ["All", "Upcoming", "Completed", "Cancelled"]

function isUpcoming(a) {
  const dt = getAppointmentDateTime(a)
  return (a.status === "confirmed" || a.status === "pending") && dt && dt >= new Date()
}

function timeKey(t) {
  return String(t || "").trim().toUpperCase()
}

function parseTimeToMinutes(str) {
  const s = String(str || "").trim().toUpperCase().replace(/\s+/g, " ")
  const match = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (!match) return NaN
  let h = Number(match[1])
  const m = Number(match[2])
  const ap = match[3]
  if (ap === "PM" && h !== 12) h += 12
  if (ap === "AM" && h === 12) h = 0
  return h * 60 + m
}

function getAppointmentDateTime(a) {
  const d = new Date(a?.appointmentDate)
  if (Number.isNaN(d.getTime())) return null
  const mins = parseTimeToMinutes(a?.timeSlot)
  if (Number.isNaN(mins)) return d
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  dt.setMinutes(mins)
  return dt
}

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

const runDummyPayment = async (appointmentId) => {
  const { data } = await api.post("/payment/dummy-pay", { appointmentId })
  return data
}

function StarsPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const active = i < value
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="p-1"
            aria-label={`${i + 1} star`}
          >
            <Star
              className={`h-6 w-6 ${active ? "text-amber-500" : "text-gray-200"}`}
              fill={active ? "currentColor" : "none"}
            />
          </button>
        )
      })}
    </div>
  )
}

export default function MyAppointments() {
  useEffect(() => {
    document.title = "My Appointments — CarePulse"
  }, [])

  const [activeTab, setActiveTab] = useState("All")
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rateOpen, setRateOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const [newDate, setNewDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState("")

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  const loadAll = async () => {
    try {
      setLoading(true)
      const [{ data: apptData }, { data: presData }] = await Promise.all([
        api.get("/appointment/patient"),
        api.get("/patient/prescriptions").catch(() => ({ data: { prescriptions: [] } })),
      ])
      setAppointments(apptData.appointments || [])
      setPrescriptions(presData.prescriptions || [])
    } catch (err) {
      toast.error(err.normalizedMessage || err.response?.data?.message || "Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const normalized = appointments.map((a) => {
      const dt = getAppointmentDateTime(a)
      const past = dt ? dt < new Date() : false
      const effectiveStatus = a.status === "pending" && past ? "expired" : a.status
      return { ...a, effectiveStatus }
    })
    const all = normalized.length
    const upcoming = normalized.filter((a) => isUpcoming({ ...a, status: a.effectiveStatus })).length
    const completed = normalized.filter(
      (a) => a.effectiveStatus === "completed" || a.effectiveStatus === "expired",
    ).length
    const cancelled = normalized.filter((a) => a.effectiveStatus === "cancelled").length
    return { All: all, Upcoming: upcoming, Completed: completed, Cancelled: cancelled }
  }, [appointments])

  const filtered = useMemo(() => {
    const normalized = appointments.map((a) => {
      const dt = getAppointmentDateTime(a)
      const past = dt ? dt < new Date() : false
      const effectiveStatus = a.status === "pending" && past ? "expired" : a.status
      return { ...a, effectiveStatus }
    })
    if (activeTab === "All") return normalized
    if (activeTab === "Upcoming")
      return normalized.filter((a) => isUpcoming({ ...a, status: a.effectiveStatus }))
    if (activeTab === "Completed")
      return normalized.filter(
        (a) => a.effectiveStatus === "completed" || a.effectiveStatus === "expired",
      )
    if (activeTab === "Cancelled")
      return normalized.filter((a) => a.effectiveStatus === "cancelled")
    return normalized
  }, [appointments, activeTab])

  const prescriptionByAppointmentId = useMemo(() => {
    const map = new Map()
    for (const p of prescriptions) {
      const apptId = p?.appointment?._id || p?.appointment
      if (apptId) map.set(String(apptId), p)
    }
    return map
  }, [prescriptions])

  const openCancel = (appt) => {
    setSelected(appt)
    setCancelReason("")
    setCancelOpen(true)
  }

  const openReschedule = (appt) => {
    setSelected(appt)
    setNewDate(null)
    setSlots([])
    setSelectedSlot("")
    setRescheduleOpen(true)
  }

  const openRate = (appt) => {
    setSelected(appt)
    setRating(5)
    setComment("")
    setRateOpen(true)
  }

  useEffect(() => {
    let mounted = true
    const loadSlots = async () => {
      if (!newDate || !selected?.doctor?._id) return
      try {
        setLoadingSlots(true)
        const { data } = await api.get("/appointment/available-slots", {
          params: { doctorId: selected.doctor._id, date: newDate.toISOString() },
        })
        if (mounted) setSlots(data.slots || [])
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load slots")
        if (mounted) setSlots([])
      } finally {
        if (mounted) setLoadingSlots(false)
      }
    }
    loadSlots()
    return () => {
      mounted = false
    }
  }, [newDate, selected])

  const handleReschedule = async () => {
    if (!selected?._id || !newDate || !selectedSlot) return
    try {
      await api.patch(`/appointment/${selected._id}/reschedule`, {
        appointmentDate: newDate.toISOString(),
        timeSlot: selectedSlot,
      })
      toast.success("Reschedule requested")
      setRescheduleOpen(false)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || "Reschedule failed")
    }
  }

  const handleRate = async () => {
    if (!selected?._id) return
    try {
      await api.post(`/appointment/${selected._id}/feedback`, { rating, comment })
      toast.success("Thanks for your feedback")
      setRateOpen(false)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback")
    }
  }

  const handleCancel = async () => {
    if (!selected?._id) return
    // NOTE: backend patient-cancel endpoint may not exist; if 403, show message.
    try {
      await api.patch(`/appointment/${selected._id}/cancel`, { reason: cancelReason })
      toast.success("Appointment cancelled")
      setCancelOpen(false)
      await loadAll()
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel not available yet")
    }
  }

  const handlePayNow = async (appt) => {
    if (!appt?._id) return
    const ok = await loadRazorpay()
    if (!ok) {
      try {
        await runDummyPayment(appt._id)
        toast.success("Dummy payment successful. Appointment confirmed.")
        await loadAll()
      } catch (err) {
        toast.error(err.response?.data?.message || "Dummy payment failed")
      }
      return
    }
    try {
      const orderRes = await api.post("/payment/create-order", {
        appointmentId: appt._id,
      })
      const { orderId, amount, currency } = orderRes.data
      const key = import.meta.env.VITE_RAZORPAY_KEY
      if (!key) {
        try {
          await runDummyPayment(appt._id)
          toast.success("Dummy payment successful. Appointment confirmed.")
          await loadAll()
        } catch (err) {
          toast.error(err.response?.data?.message || "Dummy payment failed")
        }
        return
      }
      const options = {
        key,
        amount,
        currency,
        name: "CarePulse Hospital",
        description: "Consultation Fee",
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post("/payment/verify", {
              razorpayOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              appointmentId: appt._id,
            })
            toast.success("Payment successful. Appointment confirmed.")
            await loadAll()
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed")
          }
        },
        theme: { color: "#1a73e8" },
      }
      const rz = new window.Razorpay(options)
      rz.open()
    } catch (err) {
      const msg = err.response?.data?.message || ""
      if (msg.toLowerCase().includes("razorpay keys are not configured")) {
        try {
          await runDummyPayment(appt._id)
          toast.success("Dummy payment successful. Appointment confirmed.")
          await loadAll()
        } catch (dummyErr) {
          toast.error(dummyErr.response?.data?.message || "Dummy payment failed")
        }
        return
      }
      toast.error(msg || "Failed to create payment order")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>
          <p className="mt-1 text-sm text-gray-600">Manage upcoming visits, reschedules, and feedback.</p>
        </header>

        <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  activeTab === t ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto inline-flex rounded-2xl bg-blue-50 p-4 text-blue-600">
              <CalendarDays className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">No appointments yet</p>
            <p className="mt-1 text-sm text-gray-600">
              Book your first appointment and manage everything from here.
            </p>
            <Link
              to="/doctors"
              className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Book Now
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((appt) => {
              const status = appt.effectiveStatus || appt.status
              const isCompleted = status === "completed" || status === "expired"
              const isCancelled = status === "cancelled"
              const upcoming = isUpcoming({ ...appt, status })
              const rated = Boolean(appt.feedback?.rating)
              const pres = prescriptionByAppointmentId.get(String(appt._id))
              const canPayNow = upcoming && appt.paymentStatus === "pending"

              const actions = (
                <>
                  {canPayNow ? (
                    <button
                      type="button"
                      onClick={() => handlePayNow(appt)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-sm font-medium text-white hover:opacity-95"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </button>
                  ) : null}

                  {upcoming ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openReschedule(appt)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => openCancel(appt)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:opacity-95"
                      >
                        Cancel
                      </button>
                    </>
                  ) : null}

                  {isCompleted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const url = pres?.fileUrl
                          if (!url) return toast.error("Prescription not available")
                          window.open(url, "_blank", "noopener,noreferrer")
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View Prescription
                      </button>
                      {!rated ? (
                        <button
                          type="button"
                          onClick={() => openRate(appt)}
                          className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-sm font-medium text-white hover:opacity-95"
                        >
                          Rate Doctor
                        </button>
                      ) : null}
                    </>
                  ) : null}

                  {isCancelled ? (
                    <span className="text-sm text-gray-500">
                      {appt.cancelReason ? `Reason: ${appt.cancelReason}` : "Cancelled"}
                    </span>
                  ) : null}
                </>
              )

              return (
                <AppointmentCard
                  key={appt._id}
                  appointment={{ ...appt, status }}
                  actions={actions}
                />
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={cancelOpen} title="Cancel Appointment" onClose={() => setCancelOpen(false)}>
        <p className="text-sm text-gray-600">
          Please provide a reason. This helps the hospital improve scheduling.
        </p>
        <textarea
          rows={4}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
          placeholder="Reason for cancellation"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCancelOpen(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Confirm Cancel
          </button>
        </div>
      </Modal>

      <Modal isOpen={rescheduleOpen} title="Reschedule Appointment" onClose={() => setRescheduleOpen(false)}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Select new date</p>
            <DatePicker
              selected={newDate}
              onChange={(d) => setNewDate(d)}
              minDate={new Date()}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
              placeholderText="Choose a date"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Select time slot</p>
            {loadingSlots ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-full bg-gray-100" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                {newDate ? "No available slots for this date." : "Pick a date to load slots."}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => {
                  const selected = timeKey(selectedSlot) === timeKey(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        selected ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" : "bg-green-50 text-green-700"
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRescheduleOpen(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleReschedule}
            disabled={!newDate || !selectedSlot}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Confirm Reschedule
          </button>
        </div>
      </Modal>

      <Modal isOpen={rateOpen} title="Rate Doctor" onClose={() => setRateOpen(false)}>
        <p className="text-sm text-gray-600">Your feedback helps improve care quality.</p>
        <div className="mt-3">
          <StarsPicker value={rating} onChange={setRating} />
        </div>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
          placeholder="Write a short comment (optional)"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRateOpen(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleRate}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white"
          >
            Submit
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

