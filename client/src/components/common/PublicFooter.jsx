import { Link } from "react-router-dom"
import { Activity, Mail, MapPin, Phone } from "lucide-react"

export default function PublicFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="w-full px-4 py-12 md:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                Care<span className="text-blue-600">Pulse</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              CarePulse helps patients find verified doctors, book appointments,
              and manage healthcare records in one place.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Quick Links</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
              <Link to="/doctors" className="text-gray-600 hover:text-blue-600">Find Doctors</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600">About Us</Link>
              <Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact Us</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Services</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
              <p>Doctor Discovery</p>
              <p>Appointment Booking</p>
              <p>Medical History</p>
              <p>Patient Dashboard</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Contact</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /> Pune, Maharashtra</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-600" /> +91 98765 43210</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /> support@carepulse.com</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
          CarePulse © {new Date().getFullYear()} • All rights reserved.
        </div>
      </div>
    </footer>
  )
}
