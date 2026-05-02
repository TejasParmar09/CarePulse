import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Activity, ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { useDispatch } from "react-redux"
import toast from "react-hot-toast"
import api, { getApiErrorMessage } from "../../services/api"
import { setCredentials, setError, setLoading } from "../../store/authSlice"

const roleDestination = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
}

export default function Login() {
  useEffect(() => { document.title = "Sign In — CarePulse" }, [])

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.email.trim()) next.email = "Email is required"
    if (!form.password) next.password = "Password is required"
    setErrors(next)
    if (Object.keys(next).length) return

    try {
      setSubmitting(true)
      dispatch(setLoading(true))
      dispatch(setError(null))
      const { data } = await api.post("/auth/login", { email: form.email, password: form.password })
      dispatch(setCredentials({ user: data.user, token: data.token }))
      toast.success(`Welcome back, ${data.user?.name?.split(" ")[0]}!`)
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
      <div className="w-full max-w-md relative">
        <Link to="/" className="absolute -top-12 left-0 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Care<span className="text-blue-600">Pulse</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card-md">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition ${
                    errors.email ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition ${
                    errors.password ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>

        {/* Demo creds hint */}
        
      </div>
    </div>
  )
}
