import { Activity } from "lucide-react"

export default function Loader({ message = "Loading..." }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-sky-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="h-6 w-6 text-sky-500" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  )
}
