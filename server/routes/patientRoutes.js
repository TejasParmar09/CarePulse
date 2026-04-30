const express = require("express")
const {
  getMedicalHistory,
  getPrescriptions,
  uploadPrescriptionByDoctor,
} = require("../controllers/patientController")
const { verifyToken } = require("../middleware/authMiddleware")
const { requireRole } = require("../middleware/roleMiddleware")
const { uploadSingle } = require("../middleware/uploadMiddleware")

const router = express.Router()

router.get("/medical-history", verifyToken, requireRole("patient"), getMedicalHistory)
router.get("/prescriptions", verifyToken, requireRole("patient"), getPrescriptions)
router.post(
  "/prescriptions/upload",
  verifyToken,
  requireRole("doctor"),
  uploadSingle,
  uploadPrescriptionByDoctor,
)

module.exports = router
