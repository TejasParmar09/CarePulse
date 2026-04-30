const express = require("express")
const {
  getAvailableSlots,
  bookAppointment,
  confirmAppointmentAfterPayment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelPatientAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  addFeedback,
} = require("../controllers/appointmentController")
const { verifyToken } = require("../middleware/authMiddleware")
const { requireRole } = require("../middleware/roleMiddleware")

const router = express.Router()

router.get("/available-slots", getAvailableSlots)

router.post(
  "/book",
  verifyToken,
  requireRole("patient"),
  bookAppointment,
)

router.post(
  "/confirm-payment",
  verifyToken,
  requireRole("patient"),
  confirmAppointmentAfterPayment,
)

router.get(
  "/patient",
  verifyToken,
  requireRole("patient"),
  getPatientAppointments,
)

router.get(
  "/doctor",
  verifyToken,
  requireRole("doctor"),
  getDoctorAppointments,
)

router.patch(
  "/:id/cancel",
  verifyToken,
  requireRole("patient"),
  cancelPatientAppointment,
)

router.patch(
  "/:id/status",
  verifyToken,
  requireRole("doctor", "admin"),
  updateAppointmentStatus,
)

router.patch(
  "/:id/reschedule",
  verifyToken,
  requireRole("patient"),
  rescheduleAppointment,
)

router.post(
  "/:id/feedback",
  verifyToken,
  requireRole("patient"),
  addFeedback,
)

module.exports = router
