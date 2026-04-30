import { CalendarDays, Clock, CreditCard, Hash } from "lucide-react"

function formatDay(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  })
}

const statusConfig = {
  confirmed:   { bg: "badge-blue",  dot: "bg-blue-500",   label: "Confirmed" },
  completed:   { bg: "badge-green", dot: "bg-green-500",  label: "Completed" },
  cancelled:   { bg: "badge-red",   dot: "bg-red-500",    label: "Cancelled" },
  pending:     { bg: "badge-amber", dot: "bg-amber-400",  label: "Pending" },
  rescheduled: { bg: "badge-blue",  dot: "bg-blue-400",   label: "Rescheduled" },
  expired:     { bg: "badge-red",   dot: "bg-red-400",    label: "Expired" },
}

const borderLeft = {
  confirmed:   "border-l-blue-500",
  completed:   "border-l-green-500",
  cancelled:   "border-l-red-400",
  pending:     "border-l-amber-400",
  rescheduled: "border-l-blue-400",
  expired:     "border-l-red-300",
}

function StatusBadge({ status }) {
  const s = status || "pending"
  const c = statusConfig[s] || statusConfig.pending
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export default function AppointmentCard({ appointment, actions, footer }) {
  const doc = appointment?.doctor
  const docUser = doc?.user || {}
  const doctorName = docUser?.name || "Doctor"
  const photo = docUser?.profileImage
  const spec = doc?.specialization || "General"
  const status = appointment?.status || "pending"
  const bl = borderLeft[status] || "border-l-gray-300"

  return (
    <div className={`card-hover rounded-xl border border-gray-200 border-l-4 ${bl} bg-white p-5 shadow-card`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-lg bg-blue-50 shrink-0">
            {photo ? (
              <img src={photo} alt={doctorName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-base font-bold text-blue-600">
                {doctorName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">{doctorName}</p>
            <p className="text-sm text-blue-600">{spec}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-blue-400" />
          <span>{formatDay(appointment?.appointmentDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-blue-400" />
          <span>{appointment?.timeSlot}</span>
        </div>
      </div>

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      {footer && <div className="mt-4 border-t border-gray-100 pt-4">{footer}</div>}
    </div>
  )
}
