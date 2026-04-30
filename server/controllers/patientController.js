const Appointment = require("../models/Appointment")
const Doctor = require("../models/Doctor")
const Prescription = require("../models/Prescription")

async function getMedicalHistory(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ success: false, message: "Only patients allowed" })
    }
    const appointments = await Appointment.find({
      patient: req.user._id,
      status: "completed",
    })
      .populate({
        path: "doctor",
        select: "specialization user",
        populate: { path: "user", select: "name profileImage" },
      })
      .populate("prescription")
      .sort({ appointmentDate: -1 })

    return res.json({ success: true, appointments })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function getPrescriptions(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ success: false, message: "Only patients allowed" })
    }
    const prescriptions = await Prescription.find({ patient: req.user._id })
      .populate("appointment")
      .populate({
        path: "doctor",
        select: "specialization user",
        populate: { path: "user", select: "name profileImage" },
      })
      .sort({ createdAt: -1 })
    return res.json({ success: true, prescriptions })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function uploadPrescriptionByDoctor(req, res) {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctors allowed" })
    }
    const { appointmentId, diagnosis, advice, medicines } = req.body
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "appointmentId is required" })
    }

    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" })
    }

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" })
    }
    if (appointment.doctor.toString() !== doctor._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized for this appointment" })
    }

    let parsedMedicines = []
    if (Array.isArray(medicines)) parsedMedicines = medicines
    else if (typeof medicines === "string" && medicines.trim()) {
      try {
        parsedMedicines = JSON.parse(medicines)
      } catch (_err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid medicines JSON" })
      }
    }

    const prescription = await Prescription.create({
      appointment: appointment._id,
      patient: appointment.patient,
      doctor: doctor._id,
      medicines: parsedMedicines,
      diagnosis,
      advice,
      fileUrl: req.file?.path || "",
    })

    appointment.prescription = prescription._id
    if (appointment.status !== "completed") appointment.status = "completed"
    await appointment.save()

    return res.status(201).json({ success: true, prescription })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  getMedicalHistory,
  getPrescriptions,
  uploadPrescriptionByDoctor,
}
