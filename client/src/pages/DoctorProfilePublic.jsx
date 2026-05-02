import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  ArrowLeft,
  Award,
  CalendarDays,
  GraduationCap,
  Star,
  Stethoscope,
  Banknote,
  MapPin,
  Clock,
} from "lucide-react"
import toast from "react-hot-toast"
import api from "../services/api.js"

export default function DoctorProfilePublic() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchDoctor = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/doctor/${id}`)
        if (mounted && data.success) {
          setDoctor(data.doctor)
          document.title = `Dr. ${data.doctor.user?.name || "Doctor"} - CarePulse`
        }
      } catch (err) {
        toast.error(err.normalizedMessage || "Failed to load doctor profile")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchDoctor()
    return () => { mounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Stethoscope className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Doctor Not Found</h1>
        <p className="text-gray-500 mb-6">The doctor you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate(-1)} className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white shadow-md hover:bg-blue-700 transition">
          Go Back
        </button>
      </div>
    )
  }

  const {
    user: docUser,
    specialization,
    experience,
    qualification,
    consultationFee,
    bio,
    rating,
    totalRatings,
  } = doctor

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </button>

        {/* Header Profile Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 md:flex md:items-start md:gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-blue-800 z-0 hidden md:block rounded-t-2xl"></div>

          <div className="relative z-10 flex flex-col items-center md:items-start shrink-0">
            {docUser?.profileImage ? (
              <img
                src={docUser.profileImage}
                alt={docUser?.name}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg md:h-40 md:w-40"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-4xl font-bold text-blue-600 shadow-lg md:h-40 md:w-40">
                {(docUser?.name || "D").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="mt-4 flex flex-col w-full gap-3 md:mt-6">
              <Link
                to={user ? `/patient/book/${doctor._id}` : "/login"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
              >
                <CalendarDays className="h-5 w-5" />
                Book Appointment
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex-1 text-center md:mt-8 md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 md:text-white">
              Dr. {docUser?.name}
            </h1>
            <p className="mt-1 text-lg font-medium text-blue-600 md:text-blue-100">
              {specialization}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:mt-12">
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{rating || 0} / 5</p>
                  <p className="text-xs text-gray-500">({totalRatings || 0} reviews)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{experience || 0}+ Years</p>
                  <p className="text-xs text-gray-500">Experience</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1" title={qualification}>{qualification || "Not specified"}</p>
                  <p className="text-xs text-gray-500">Qualification</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <Banknote className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">₹{consultationFee || 0}</p>
                  <p className="text-xs text-gray-500">Consultation Fee</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* About Section */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">About Doctor</h2>
            {bio ? (
              <div className="prose prose-sm text-gray-600">
                {bio.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No bio available for this doctor.</p>
            )}
          </div>

          {/* Contact / Clinic Info Section */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Clinic Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">CarePulse Hospital</p>
                    <p className="text-sm text-gray-500 mt-1">123 Health Avenue, Medical District, Cityville</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Timing</p>
                    <p className="text-sm text-gray-500 mt-1">Mon - Sat: 09:00 AM - 05:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
