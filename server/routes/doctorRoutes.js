const express = require("express")
const {
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  updateAvailability,
  getDoctorStats,
} = require("../controllers/doctorController")
const { verifyToken } = require("../middleware/authMiddleware")
const { requireRole } = require("../middleware/roleMiddleware")

const router = express.Router()

router.get("/", getAllDoctors)
router.get("/stats/me", verifyToken, requireRole("doctor"), getDoctorStats)
router.get("/:id", getDoctorById)
router.put("/profile", verifyToken, requireRole("doctor"), updateDoctorProfile)
router.put("/availability", verifyToken, requireRole("doctor"), updateAvailability)

module.exports = router
