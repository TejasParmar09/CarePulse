import { Navigate, Route, Routes, useParams } from "react-router-dom"
import ProtectedRoute from "./components/common/ProtectedRoute"
import ScrollToTop from "./components/common/ScrollToTop"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import PatientDashboard from "./pages/patient/Dashboard"
import FindDoctors from "./pages/patient/FindDoctors"
import BookAppointment from "./pages/patient/BookAppointment"
import MyAppointments from "./pages/patient/MyAppointments"
import MedicalHistory from "./pages/patient/MedicalHistory"
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

function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen bg-brand-gray-50 p-6 text-brand-gray-900">
      <div className="rounded-card bg-brand-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
    </div>
  )
}

function DoctorProfilePage() {
  const { id } = useParams()
  return <PlaceholderPage title={`Doctor Profile (${id})`} />
}

function BookAppointmentPage() {
  const { doctorId } = useParams()
  return <PlaceholderPage title={`Book Appointment (${doctorId})`} />
}

export default function App() {
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
        <Route path="/doctors/:id" element={<DoctorProfilePage />} />

        <Route path="/patient/*" element={<ProtectedRoute role="patient" />}>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="book/:doctorId" element={<BookAppointment />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="history" element={<MedicalHistory />} />
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
