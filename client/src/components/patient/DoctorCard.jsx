import { Link } from "react-router-dom"
import { BadgeCheck, Star } from "lucide-react"

function Stars({ value = 0, count = 0 }) {
  const full = Math.round(Number(value) || 0)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < full ? "text-amber-400" : "text-gray-200"}`}
          fill={i < full ? "currentColor" : "none"} />
      ))}
      <span className="ml-1 text-xs text-gray-500">({count || 0})</span>
    </div>
  )
}

export default function DoctorCard({ doctor }) {
  const user = doctor?.user || {}
  const name = user?.name || "Doctor"
  const specialization = doctor?.specialization || "General"
  const experience = doctor?.experience ?? 0
  const qualification = doctor?.qualification || "MBBS"
  const fee = doctor?.consultationFee ?? 0
  const rating = doctor?.rating ?? 0
  const totalRatings = doctor?.totalRatings ?? 0

  return (
    <div className="card-hover overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 pt-4 pb-8">
        <span className="flex w-fit items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
          <BadgeCheck className="h-3 w-3" /> Verified
        </span>
      </div>
      {/* Avatar */}
      <div className="relative px-4 pb-4">
        <div className="-mt-6 mb-3 h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-blue-600 text-lg font-bold text-white">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <p className="font-bold text-gray-900">{name}</p>
        <p className="mt-0.5 text-sm font-medium text-blue-600">{specialization}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {experience}+ yrs
          </span>
          <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {qualification}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Stars value={rating} count={totalRatings} />
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">
            ₹{fee}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to={`/doctors/${doctor?._id}`}
            className="rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            View Profile
          </Link>
          <Link to={`/patient/book/${doctor?._id}`}
            className="rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-700">
            Book Now
          </Link>
        </div>
      </div>
    </div>
  )
}
