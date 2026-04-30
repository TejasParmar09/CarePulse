import { useEffect, useMemo, useState } from "react"
import { Search, SlidersHorizontal, Stethoscope, X } from "lucide-react"
import DoctorCard from "../../components/patient/DoctorCard"
import Navbar from "../../components/common/Navbar"
import PublicFooter from "../../components/common/PublicFooter"
import api from "../../services/api"
import { useSearchParams } from "react-router-dom"

const specializations = [
  "Cardiology","Orthopedics","Neurology","Dermatology",
  "Pediatrics","Gynecology","ENT","Ophthalmology","General Physician",
]

function SkeletonCard() {
  return <div className="h-72 animate-pulse rounded-xl border border-gray-100 bg-gray-50" />
}

export default function FindDoctors() {
  useEffect(() => { document.title = "Find Doctors — CarePulse" }, [])

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const [selectedSpec, setSelectedSpec] = useState(searchParams.get("specialization") || "")
  const [sortBy, setSortBy] = useState("rating")
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { setSelectedSpec(searchParams.get("specialization") || "") }, [searchParams])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const params = {}
        if (query.trim()) params.search = query.trim()
        if (selectedSpec) params.specialization = selectedSpec
        const { data } = await api.get("/doctor", { params })
        if (mounted) setDoctors(data.doctors || [])
      } catch { if (mounted) setDoctors([]) }
      finally { if (mounted) setLoading(false) }
    }
    const t = setTimeout(load, 250)
    return () => { mounted = false; clearTimeout(t) }
  }, [query, selectedSpec])

  const sorted = useMemo(() => {
    const list = [...doctors]
    if (sortBy === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sortBy === "experience") list.sort((a, b) => (b.experience || 0) - (a.experience || 0))
    if (sortBy === "fee") list.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0))
    return list
  }, [doctors, sortBy])

  const setSpec = (s) => {
    const val = selectedSpec === s ? "" : s
    setSelectedSpec(val)
    setSearchParams((p) => {
      const next = new URLSearchParams(p)
      if (val) next.set("specialization", val)
      else next.delete("specialization")
      return next
    })
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="w-full bg-blue-600 px-4 py-10 md:px-8 xl:px-10 2xl:px-12">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-white md:text-3xl">Find a Doctor</h1>
          <p className="mt-1 text-sm text-blue-100">Search from verified specialists and book your appointment instantly.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by doctor name…"
                className="w-full rounded-lg border-0 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 shadow-sm">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none">
                <option value="rating">Best Rating</option>
                <option value="experience">Most Experienced</option>
                <option value="fee">Lowest Fee</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8 md:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="h-fit rounded-xl border border-gray-200 bg-white p-4 shadow-card lg:col-span-1">
            <p className="mb-3 text-sm font-bold text-gray-900">Specialization</p>
            <div className="flex flex-col gap-0.5">
              <button type="button" onClick={() => { setSelectedSpec(""); setSearchParams({}) }}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  selectedSpec === "" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                }`}>
                All Specializations
              </button>
              {specializations.map((s) => (
                <button key={s} type="button" onClick={() => setSpec(s)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    selectedSpec === s ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </aside>

          {/* Grid */}
          <section className="lg:col-span-3">
            {!loading && (
              <p className="mb-4 text-sm text-gray-500">
                Showing <strong className="text-gray-900">{sorted.length}</strong> doctor{sorted.length !== 1 ? "s" : ""}
                {selectedSpec ? ` in ${selectedSpec}` : ""}
              </p>
            )}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center shadow-card">
                <Stethoscope className="mb-3 h-12 w-12 text-gray-200" />
                <p className="font-semibold text-gray-700">No doctors found</p>
                <p className="mt-1 text-sm text-gray-400">Try a different name or clear the filter.</p>
                {selectedSpec && (
                  <button type="button" onClick={() => { setSelectedSpec(""); setSearchParams({}) }}
                    className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition">
                    Clear filter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sorted.map((doc) => <DoctorCard key={doc._id} doctor={doc} />)}
              </div>
            )}
          </section>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
