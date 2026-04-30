import { useEffect } from "react"
import { Activity, Shield, Stethoscope, Users } from "lucide-react"
import Navbar from "../components/common/Navbar"
import PublicFooter from "../components/common/PublicFooter"

export default function About() {
  useEffect(() => {
    document.title = "About Us — CarePulse"
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="w-full bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="w-full px-4 py-16 md:px-8 xl:px-10 2xl:px-12">
          <h1 className="text-3xl font-extrabold md:text-4xl">About CarePulse</h1>
          <p className="mt-3 max-w-3xl text-blue-100">
            CarePulse is a smart hospital appointment platform built to simplify healthcare
            access for patients, doctors, and administrators.
          </p>
        </div>
      </section>

      <section className="w-full px-4 py-12 md:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Users, title: "Patient First", desc: "Simple booking and transparent care journey." },
            { icon: Stethoscope, title: "Verified Doctors", desc: "Trusted specialists with profile and ratings." },
            { icon: Shield, title: "Secure Data", desc: "Patient data handled with privacy and safety in mind." },
            { icon: Activity, title: "Efficient System", desc: "Faster operations for clinics and hospitals." },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
                <div className="inline-flex rounded-lg bg-blue-50 p-2.5 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-base font-bold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="w-full px-4 pb-14 md:px-8 xl:px-10 2xl:px-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
          <p className="mt-3 max-w-4xl text-gray-600">
            Our mission is to make healthcare appointment management easy, fast, and reliable.
            We aim to reduce waiting time, improve communication, and provide a better digital
            healthcare experience for everyone.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
