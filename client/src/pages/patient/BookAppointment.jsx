import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import toast from "react-hot-toast"
import { CheckCircle2, CreditCard, Stethoscope } from "lucide-react"
import api from "../../services/api"
import { useSelector } from "react-redux"

const steps = [
  { key: "details", label: "Doctor Details" },
  { key: "slot", label: "Select Slot" },
  { key: "payment", label: "Payment" },
]

const types = [
  { value: "consultation", label: "Consultation" },
  { value: "follow-up", label: "Follow-up" },
  { value: "emergency", label: "Emergency" },
]

function StepHeader({ current }) {
  return (
    <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-3">
        {steps.map((s, idx) => {
          const active = idx === current
          const done = idx < current
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  done ? "bg-green-50 text-green-600" : active ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <div>
                <p className={`text-sm font-medium ${active ? "text-gray-900" : "text-gray-600"}`}>
                  {s.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const runDummyPayment = async (appointmentId) => {
  const { data } = await api.post("/payment/dummy-pay", { appointmentId })
  return data
}

function timeKey(t) {
  return String(t || "").trim().toUpperCase()
}

export default function BookAppointment() {
  useEffect(() => {
    document.title = "Book Appointment — CarePulse"
  }, [])

  const { doctorId } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const [step, setStep] = useState(0)

  const [doctor, setDoctor] = useState(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)

  const [appointmentType, setAppointmentType] = useState("consultation")
  const [symptoms, setSymptoms] = useState("")

  const [date, setDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState("")
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [appointment, setAppointment] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoadingDoctor(true)
        const { data } = await api.get(`/doctor/${doctorId}`)
        if (mounted) setDoctor(data.doctor)
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load doctor")
      } finally {
        if (mounted) setLoadingDoctor(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [doctorId])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!date) return
      try {
        setLoadingSlots(true)
        setSelectedSlot("")
        const iso = date.toISOString()
        const { data } = await api.get("/appointment/available-slots", {
          params: { doctorId, date: iso },
        })
        if (mounted) setSlots(data.slots || [])
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load slots")
        if (mounted) setSlots([])
      } finally {
        if (mounted) setLoadingSlots(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [date, doctorId])

  const fee = useMemo(() => Number(doctor?.consultationFee ?? 0), [doctor])
  const gst = useMemo(() => Math.round(fee * 0.18 * 100) / 100, [fee])
  const total = useMemo(() => Math.round((fee + gst) * 100) / 100, [fee, gst])

  const canContinueDetails = Boolean(doctor && appointmentType)
  const canContinueSlot = Boolean(date && selectedSlot)

  const createAppointment = async () => {
    try {
      setCreating(true)
      const { data } = await api.post("/appointment/book", {
        doctorId,
        appointmentDate: date.toISOString(),
        timeSlot: selectedSlot,
        type: appointmentType,
        symptoms,
      })
      setAppointment(data.appointment)
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed")
    } finally {
      setCreating(false)
    }
  }

  const handlePayment = async () => {
    if (!appointment?._id) {
      toast.error("Missing appointment. Please go back and book again.")
      return
    }

    const ok = await loadRazorpay()
    if (!ok) {
      try {
        await runDummyPayment(appointment._id)
        toast.success("Dummy payment successful. Appointment confirmed.")
        navigate("/patient/appointments")
      } catch (err) {
        toast.error(err.response?.data?.message || "Dummy payment failed")
      }
      return
    }

    try {
      const orderRes = await api.post("/payment/create-order", {
        appointmentId: appointment._id,
      })

      const { orderId, amount, currency } = orderRes.data
      const key = import.meta.env.VITE_RAZORPAY_KEY
      if (!key) {
        try {
          await runDummyPayment(appointment._id)
          toast.success("Dummy payment successful. Appointment confirmed.")
          navigate("/patient/appointments")
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
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        handler: async (response) => {
          try {
            await api.post("/payment/verify", {
              razorpayOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              appointmentId: appointment._id,
            })
            toast.success("Payment successful. Appointment confirmed.")
            navigate("/patient/appointments")
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
          await runDummyPayment(appointment._id)
          toast.success("Dummy payment successful. Appointment confirmed.")
          navigate("/patient/appointments")
        } catch (dummyErr) {
          toast.error(dummyErr.response?.data?.message || "Dummy payment failed")
        }
        return
      }
      toast.error(msg || "Failed to create payment order")
    }
  }

  const docUser = doctor?.user || {}
  const docName = docUser?.name || "Doctor"
  const docSpec = doctor?.specialization || "General"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <StepHeader current={step} />

        {step === 0 && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-gray-900">Doctor Details</h2>
              <p className="mt-1 text-sm text-gray-600">Review doctor details and select appointment type.</p>

              <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                {loadingDoctor ? (
                  <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full bg-blue-50">
                      {docUser?.profileImage ? (
                        <img src={docUser.profileImage} alt={docName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-blue-600">
                          {docName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-gray-900">{docName}</p>
                      <p className="text-sm font-medium text-blue-600">{docSpec}</p>
                      <p className="mt-1 text-sm text-gray-600">Consultation Fee: <span className="font-semibold text-green-600">₹{fee}</span></p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-gray-700">Appointment Type</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {types.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setAppointmentType(t.value)}
                      className={`rounded-xl border p-3 text-left ${
                        appointmentType === t.value
                          ? "border-blue-200 bg-blue-50 text-blue-600"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        <span className="text-sm font-semibold">{t.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Describe symptoms</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                  placeholder="Describe symptoms or concerns (optional)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900">Next</h3>
              <p className="mt-1 text-sm text-gray-600">Proceed to select a time slot.</p>
              <button
                type="button"
                disabled={!canContinueDetails}
                onClick={() => setStep(1)}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-gray-900">Select Slot</h2>
              <p className="mt-1 text-sm text-gray-600">Pick a future date and choose an available time slot.</p>

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-gray-700">Select Date</p>
                <DatePicker
                  selected={date}
                  onChange={(d) => setDate(d)}
                  minDate={new Date()}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-200"
                  placeholderText="Choose a date"
                />
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-gray-700">Available Slots</p>
                {loadingSlots ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded-full bg-gray-100" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                    {date ? "No slots available for the selected date." : "Select a date to view slots."}
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
                            selected
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
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

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900">Next</h3>
              <p className="mt-1 text-sm text-gray-600">Confirm your slot and proceed to payment.</p>

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-medium text-gray-900">{docName}</p>
                <p className="text-blue-600">{docSpec}</p>
                <p className="mt-2">
                  Date: <span className="font-medium">{date ? date.toLocaleDateString("en-IN") : "-"}</span>
                </p>
                <p>
                  Time: <span className="font-medium">{selectedSlot || "-"}</span>
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!canContinueSlot || creating}
                  onClick={createAppointment}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {creating ? "Booking..." : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              <p className="mt-1 text-sm text-gray-600">Complete payment to confirm the appointment.</p>

              <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{docName}</p>
                    <p className="text-sm font-medium text-blue-600">{docSpec}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="mt-1 text-2xl font-semibold text-green-600">₹{total}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                  <p>
                    Date:{" "}
                    <span className="font-medium">
                      {date ? date.toLocaleDateString("en-IN") : "-"}
                    </span>
                  </p>
                  <p>
                    Time: <span className="font-medium">{selectedSlot || "-"}</span>
                  </p>
                  <p>
                    Type: <span className="font-medium">{appointmentType}</span>
                  </p>
                  <p className="truncate">
                    Symptoms: <span className="font-medium">{symptoms || "-"}</span>
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span>Consultation fee</span>
                    <span className="font-medium">₹{fee}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
                    <span>GST (18%)</span>
                    <span className="font-medium">₹{gst}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">₹{total}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900">Pay securely</h3>
              <p className="mt-1 text-sm text-gray-600">
                You will be redirected to Razorpay checkout.
              </p>
              <button
                type="button"
                onClick={handlePayment}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
              >
                <CreditCard className="h-4 w-4" />
                Pay ₹{total} with Razorpay
              </button>
              <button
                type="button"
                onClick={() => navigate("/patient/appointments")}
                className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700"
              >
                I’ll pay later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

