const express = require("express")
const { verifyToken } = require("../middleware/authMiddleware")
const { requireRole } = require("../middleware/roleMiddleware")
const {
  addDoctor,
  getAllDoctors,
  updateDoctor,
  verifyDoctor,
  deleteDoctor,
  getAllAppointments,
  getRecentPatients,
  getDashboardStats,
  manageSchedule,
  getAnalytics,
} = require("../controllers/adminController")

const router = express.Router()

router.use(verifyToken, requireRole("admin"))

router.post("/doctors", addDoctor)
router.get("/doctors", getAllDoctors)
router.put("/doctors/:id", updateDoctor)
router.patch("/doctors/:id/verify", verifyDoctor)
router.delete("/doctors/:id", deleteDoctor)
router.get("/appointments", getAllAppointments)
router.get("/patients", getRecentPatients)
router.get("/stats", getDashboardStats)
router.get("/analytics", getAnalytics)
router.put("/doctors/:id/schedule", manageSchedule)

module.exports = router
