import { X } from "lucide-react"

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
}

export default function Modal({ isOpen, title, onClose, children, size = "md", bodyClassName = "" }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-gray-900/40"
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-[90vh] w-full flex-col rounded-xl border border-gray-100 bg-white shadow-sm ${sizeClasses[size] || sizeClasses.md}`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`overflow-y-auto px-5 py-4 ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  )
}
