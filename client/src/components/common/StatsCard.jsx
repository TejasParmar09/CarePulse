export default function StatsCard({ title, value, icon: Icon, trend, color = "blue" }) {
  const palettes = {
    blue:   { bg: "bg-white", border: "border-blue-100",   icon: "bg-blue-600",   text: "text-blue-600" },
    green:  { bg: "bg-white", border: "border-green-100",  icon: "bg-green-600",  text: "text-green-600" },
    amber:  { bg: "bg-white", border: "border-amber-100",  icon: "bg-amber-500",  text: "text-amber-600" },
    red:    { bg: "bg-white", border: "border-red-100",    icon: "bg-red-500",    text: "text-red-600" },
    purple: { bg: "bg-white", border: "border-purple-100", icon: "bg-purple-600", text: "text-purple-600" },
  }
  const c = palettes[color] || palettes.blue
  const isPositive = String(trend || "").trim().startsWith("+")

  return (
    <div className={`card-hover rounded-xl border ${c.border} ${c.bg} p-5 shadow-card`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-lg ${c.icon} p-2.5`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      {trend && (
        <p className={`mt-3 text-xs font-semibold ${isPositive ? "text-green-600" : "text-red-500"}`}>
          {trend}
        </p>
      )}
    </div>
  )
}
