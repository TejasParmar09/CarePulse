import { useEffect, useMemo, useState } from "react"
import { Activity, ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import toast from "react-hot-toast"
import api, { getApiErrorMessage } from "../../services/api"
import { setCredentials, setError, setLoading } from "../../store/authSlice"

const specializations = [
  "Cardiology","Orthopedics","Neurology","Dermatology",
  "Pediatrics","Gynecology","ENT","Ophthalmology","General Physician",
]

const roleDestination = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
}

function passwordStrength(p) {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}

const strengthMeta = [
  { label: "Weak",   color: "bg-red-500",   width: "25%" },
  { label: "Fair",   color: "bg-amber-500", width: "50%" },
  { label: "Good",   color: "bg-blue-500",  width: "75%" },
  { label: "Strong", color: "bg-green-500", width: "100%" },
]

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(err) {
  return `w-full rounded-lg border py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 transition ${
    err ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
  }`
}

export default function Register() {
  useEffect(() => { document.title = "Register — CarePulse" }, [])
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    role: "patient", specialization: "", consultationFee: "",
    gender: "male", termsAccepted: false,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const strength = useMemo(() => passwordStrength(form.password), [form.password])
  const meta = strengthMeta[Math.max(strength - 1, 0)]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = "Full name is required"
    if (!form.email.trim()) next.email = "Email is required"
    if (!form.password) next.password = "Password is required"
    if (!form.phone.trim()) next.phone = "Phone number is required"
    if (!form.termsAccepted) next.termsAccepted = "You must accept the terms"
    if (form.role === "doctor" && !form.specialization) next.specialization = "Specialization is required"
    setErrors(next)
    if (Object.keys(next).length) { toast.error("Please fix highlighted fields"); return }

    try {
      setSubmitting(true)
      dispatch(setLoading(true))
      dispatch(setError(null))
      const payload = {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, role: form.role, gender: form.gender,
      }
      if (form.role === "doctor") {
        payload.specialization = form.specialization
        if (form.consultationFee) payload.consultationFee = Number(form.consultationFee)
      }
      const { data } = await api.post("/auth/register", payload)
      dispatch(setCredentials({ user: data.user, token: data.token }))
      toast.success("Registration successful! Check your email for confirmation.")
      navigate("/")
    } catch (error) {
      const message = getApiErrorMessage(error)
      dispatch(setError(message))
      toast.error(message)
    } finally {
      dispatch(setLoading(false))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg relative">
        <Link to="/" className="absolute -top-12 left-0 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Care<span className="text-blue-600">Pulse</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Join CarePulse and manage your healthcare</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card-md">
          {/* Role toggle */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-700">I am a</label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
              {["patient", "doctor"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: r }))}
                  className={`rounded-md py-2 text-sm font-semibold capitalize transition ${
                    form.role === r
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <Field label="Full Name" error={errors.name}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe" className={`${inputCls(errors.name)} pl-9`} />
              </div>
            </Field>

            {/* Email */}
            <Field label="Email Address" error={errors.email}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" className={`${inputCls(errors.email)} pl-9`} />
              </div>
            </Field>

            {/* Phone + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="9876543210" className={`${inputCls(errors.phone)} pl-9`} />
                </div>
              </Field>
              <Field label="Gender">
                <select name="gender" value={form.gender} onChange={handleChange} className={inputCls(false)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            {/* Doctor-only fields */}
            {form.role === "doctor" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Specialization" error={errors.specialization}>
                  <select name="specialization" value={form.specialization} onChange={handleChange}
                    className={inputCls(errors.specialization)}>
                    <option value="">Select…</option>
                    {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Consultation Fee (₹)">
                  <input type="number" name="consultationFee" value={form.consultationFee}
                    onChange={handleChange} placeholder="500" min="0"
                    className={inputCls(false)} />
                </Field>
              </div>
            )}

            {/* Password */}
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 8 characters" className={`${inputCls(errors.password)} pl-9 pr-10`}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full transition-all ${meta.color}`} style={{ width: meta.width }} />
                  </div>
                  <p className={`mt-1 text-xs font-medium ${
                    strength === 4 ? "text-green-600" : strength >= 3 ? "text-blue-600" : strength === 2 ? "text-amber-600" : "text-red-500"
                  }`}>{meta.label}</p>
                </div>
              )}
            </Field>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" name="termsAccepted" checked={form.termsAccepted}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600" />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <span className="font-medium text-blue-600">Terms of Service</span>{" "}
                  and{" "}
                  <span className="font-medium text-blue-600">Privacy Policy</span>
                </span>
              </label>
              {errors.termsAccepted && <p className="mt-1 text-xs text-red-500">{errors.termsAccepted}</p>}
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
