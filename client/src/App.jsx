import { useEffect } from "react"
import { Navigate, Route, Routes, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import ProtectedRoute from "./components/common/ProtectedRoute"
import ScrollToTop from "./components/common/ScrollToTop"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import PatientDashboard from "./pages/patient/Dashboard"
import FindDoctors from "./pages/patient/FindDoctors"
import BookAppointment from "./pages/patient/BookAppointment"
import MyAppointments from "./pages/patient/MyAppointments"
import MedicalHistory from "./pages/patient/MedicalHistory"
import PatientProfile from "./pages/patient/Profile"
import DoctorProfilePublic from "./pages/DoctorProfilePublic"
import DoctorDashboard from "./pages/doctor/Dashboard"
import DoctorAppointments from "./pages/doctor/Appointments"
import DoctorPatientDetails from "./pages/doctor/PatientDetails"
import DoctorProfile from "./pages/doctor/Profile"
import AdminDashboard from "./pages/admin/Dashboard"
import ManageDoctors from "./pages/admin/ManageDoctors"
import ManageAppointments from "./pages/admin/ManageAppointments"
import Analytics from "./pages/admin/Analytics"
import Home from "./pages/Home"
import About from "./pages/About"
import Contact from "./pages/Contact"
import NotFound from "./pages/NotFound"
import api from "./services/api"
import { setCredentials, logout } from "./store/authSlice"

function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen bg-brand-gray-50 p-6 text-brand-gray-900">
      <div className="rounded-card bg-brand-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
    </div>
  )
}

function BookAppointmentPage() {
  const { doctorId } = useParams()
  return <PlaceholderPage title={`Book Appointment (${doctorId})`} />
}

export default function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, user, token } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated && !user) {
      api.get("/auth/me")
        .then(({ data }) => {
          if (data.success) {
            dispatch(setCredentials({ user: data.user, token }))
          }
        })
        .catch(() => {
          dispatch(logout())
        })
    }
  }, [isAuthenticated, user, token, dispatch])

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<FindDoctors />} />
        <Route path="/doctors/:id" element={<DoctorProfilePublic />} />

        <Route path="/patient/*" element={<ProtectedRoute role="patient" />}>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="book/:doctorId" element={<BookAppointment />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="history" element={<MedicalHistory />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>

        <Route path="/doctor/*" element={<ProtectedRoute role="doctor" />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="patients/:appointmentId" element={<DoctorPatientDetails />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>

        <Route path="/admin/*" element={<ProtectedRoute role="admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="doctors" element={<ManageDoctors />} />
          <Route path="appointments" element={<ManageAppointments />} />
          {/* <Route path="analytics" element={<Analytics />} /> */}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
