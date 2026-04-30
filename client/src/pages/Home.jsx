import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight, BadgeCheck, Calendar, Heart,
  Search, Shield, Star, Stethoscope, Phone, Clock, ChevronRight,
} from "lucide-react"
import api from "../services/api"
import Navbar from "../components/common/Navbar"
import DoctorCard from "../components/patient/DoctorCard"
import PublicFooter from "../components/common/PublicFooter"

const specializations = [
  { name: "Cardiology",     icon: "❤️",  desc: "Heart & Cardiovascular" },
  { name: "Orthopedics",    icon: "🦴",  desc: "Bones & Joints" },
  { name: "Neurology",      icon: "🧠",  desc: "Brain & Nerves" },
  { name: "Dermatology",    icon: "✨",  desc: "Skin & Hair" },
  { name: "Pediatrics",     icon: "👶",  desc: "Children's Health" },
  { name: "Gynecology",     icon: "🌸",  desc: "Women's Health" },
  { name: "ENT",            icon: "👂",  desc: "Ear, Nose & Throat" },
  { name: "Ophthalmology",  icon: "👁️",  desc: "Eye Care" },
]

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Patient",
    text: "CarePulse made booking a specialist so easy. Got an appointment with a cardiologist within hours!",
    stars: 5, avatar: "P",
  },
  {
    name: "Dr. Rakesh Patel",
    role: "Cardiologist",
    text: "The platform has streamlined my schedule completely. Patient management and prescriptions all in one place.",
    stars: 5, avatar: "R",
  },
  {
    name: "Ankit Joshi",
    role: "Patient",
    text: "I love how I can track my medical history and upcoming appointments easily. Clean and intuitive UI.",
    stars: 5, avatar: "A",
  },
]

const steps = [
  { num: "01", title: "Find a Doctor",       desc: "Search by specialization, name or availability.",        icon: Search },
  { num: "02", title: "Book Appointment",    desc: "Pick your preferred date and time slot instantly.",      icon: Calendar },
  { num: "03", title: "Get Consultation",    desc: "Visit the doctor and receive quality care.",             icon: Stethoscope },
]

export default function Home() {
  useEffect(() => { document.title = "CarePulse — Hospital Appointment System" }, [])
  const [featuredDoctors, setFeaturedDoctors] = useState([])

  useEffect(() => {
    api.get("/doctor", { params: { limit: 4 } })
      .then(({ data }) => setFeaturedDoctors((data.doctors || []).slice(0, 4)))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen w-full bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="w-full px-4 py-20 md:px-8 md:py-28 xl:px-10 2xl:px-12">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
              Appointment Booking
            </span>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Your Health, <br />Our Priority
            </h1>
            <p className="mt-5 text-lg text-blue-100 md:text-xl">
              Book appointments with verified specialists, manage your medical records,
              and get quality healthcare — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Find Doctors <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white">
        <div className="w-full px-4 py-8 md:px-8 xl:px-10 2xl:px-12">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: "500+", label: "Verified Doctors" },
              { value: "10k+", label: "Happy Patients" },
              { value: "50+",  label: "Specializations" },
              { value: "24/7", label: "Support Available" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-blue-600 md:text-3xl">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specializations ──────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="w-full px-4 md:px-8 xl:px-10 2xl:px-12">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Browse by Specialization</h2>
            <p className="mt-2 text-gray-500">Find the right specialist for your healthcare needs</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {specializations.map((s) => (
              <Link
                key={s.name}
                to={`/doctors?specialization=${encodeURIComponent(s.name)}`}
                className="card-hover flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 text-center transition"
              >
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="w-full px-4 md:px-8 xl:px-10 2xl:px-12">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">How It Works</h2>
            <p className="mt-2 text-gray-500">Simple steps to get quality healthcare</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="relative rounded-xl border border-blue-100 bg-blue-50 p-6">
                  <span className="text-5xl font-extrabold text-blue-100">{step.num}</span>
                  <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Doctors ─────────────────────────────────────── */}
      {featuredDoctors.length > 0 && (
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="w-full px-4 md:px-8 xl:px-10 2xl:px-12">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Our Doctors</h2>
                <p className="mt-1 text-gray-500">Meet our verified healthcare specialists</p>
              </div>
              <Link to="/doctors" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredDoctors.map((doc) => (
                <DoctorCard key={doc._id} doctor={doc} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="w-full px-4 md:px-8 xl:px-10 2xl:px-12">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Why Choose CarePulse?</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[
              { icon: BadgeCheck, title: "Verified Doctors",       desc: "All doctors are verified by our admin team before onboarding.",    color: "text-blue-600 bg-blue-50" },
              { icon: Shield,     title: "Secure & Private",       desc: "Your health data is encrypted and never shared without consent.",  color: "text-green-600 bg-green-50" },
              { icon: Clock,      title: "Instant Booking",        desc: "Book, reschedule or cancel appointments in seconds.",             color: "text-blue-600 bg-blue-50" },
              { icon: Heart,      title: "Medical History",        desc: "Access your complete medical records and prescriptions anytime.", color: "text-red-500 bg-red-50" },
              { icon: Phone,      title: "Email Notifications",    desc: "Get confirmation and reminder emails for every appointment.",     color: "text-blue-600 bg-blue-50" },
              { icon: Star,       title: "Doctor Ratings",         desc: "Read reviews and ratings to find the best doctor for you.",      color: "text-amber-500 bg-amber-50" },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">
                  <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="bg-blue-50 py-16 md:py-20">
        <div className="w-full px-4 md:px-8 xl:px-10 2xl:px-12">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">What People Say</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-blue-100 bg-white p-6 shadow-card">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">"{t.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-blue-600 py-16">
        <div className="w-full px-4 text-center md:px-8 xl:px-10 2xl:px-12">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Ready to Get Started?</h2>
          <p className="mt-3 text-blue-100">Join thousands of patients managing their health with CarePulse.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Create Free Account
            </Link>
            <Link
              to="/doctors"
              className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
