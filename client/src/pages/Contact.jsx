import { useEffect, useState } from "react"
import { Mail, MapPin, Phone } from "lucide-react"
import toast from "react-hot-toast"
import Navbar from "../components/common/Navbar"
import PublicFooter from "../components/common/PublicFooter"

export default function Contact() {
  useEffect(() => {
    document.title = "Contact Us — CarePulse"
  }, [])

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    toast.success("Thanks! We received your message.")
    setForm({ name: "", email: "", subject: "", message: "" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="w-full bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="w-full px-4 py-16 md:px-8 xl:px-10 2xl:px-12">
          <h1 className="text-3xl font-extrabold md:text-4xl">Contact Us</h1>
          <p className="mt-3 max-w-3xl text-blue-100">
            Have a question or need support? Reach out to our team.
          </p>
        </div>
      </section>

      <section className="w-full px-4 py-12 md:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <p className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-blue-600" /> Pune, Maharashtra
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <p className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-blue-600" /> +91 98765 43210
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <p className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="h-4 w-4 text-blue-600" /> support@carepulse.com
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-card lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900">Send us a message</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Your Name"
                required
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-300"
              />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="Your Email"
                required
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-300"
              />
            </div>
            <input
              name="subject"
              value={form.subject}
              onChange={onChange}
              placeholder="Subject"
              required
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-300"
            />
            <textarea
              name="message"
              value={form.message}
              onChange={onChange}
              rows={6}
              placeholder="Write your message..."
              required
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-300"
            />
            <button
              type="submit"
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
