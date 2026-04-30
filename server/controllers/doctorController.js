const Appointment = require("../models/Appointment")
const Doctor = require("../models/Doctor")
const User = require("../models/User")

function startOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 0, 0, 0, 0)
}

function endOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999)
}

async function getAllDoctors(req, res) {
  try {
    const { search, specialization } = req.query
    const doctorFilter = { isVerified: true }
    if (specialization) doctorFilter.specialization = specialization

    if (search) {
      const users = await User.find({
        role: "doctor",
        name: { $regex: search, $options: "i" },
      }).select("_id")
      doctorFilter.$or = [
        { specialization: { $regex: search, $options: "i" } },
        { user: { $in: users.map((u) => u._id) } },
      ]
    }

    const doctors = await Doctor.find(doctorFilter)
      .populate("user", "name profileImage email")
      .sort({ rating: -1, createdAt: -1 })

    return res.json({ success: true, doctors })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function getDoctorById(req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "user",
      "name profileImage email phone dateOfBirth gender bloodGroup address",
    )
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }
    return res.json({ success: true, doctor })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function updateDoctorProfile(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" })
    }
    const { bio, experience, qualifications, consultationFee } = req.body
    if (bio !== undefined) doctor.bio = bio
    if (experience !== undefined) doctor.experience = Number(experience)
    if (qualifications !== undefined) doctor.qualification = qualifications
    if (consultationFee !== undefined)
      doctor.consultationFee = Number(consultationFee)
    await doctor.save()
    return res.json({ success: true, doctor })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function updateAvailability(req, res) {
  try {
    const { availableSlots } = req.body
    if (!Array.isArray(availableSlots)) {
      return res
        .status(400)
        .json({ success: false, message: "availableSlots must be an array" })
    }
    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user._id },
      { availableSlots },
      { new: true, runValidators: true },
    )
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" })
    }
    return res.json({ success: true, availableSlots: doctor.availableSlots })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function getDoctorStats(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" })
    }
    const dayStart = startOfDay(new Date())
    const dayEnd = endOfDay(new Date())

    const [todayAppointments, uniquePatients, earningsAgg] = await Promise.all([
      Appointment.countDocuments({
        doctor: doctor._id,
        appointmentDate: { $gte: dayStart, $lte: dayEnd },
      }),
      Appointment.distinct("patient", { doctor: doctor._id }),
      Appointment.aggregate([
        { $match: { doctor: doctor._id, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
      ]),
    ])

    return res.json({
      success: true,
      stats: {
        todayAppointments,
        totalPatients: uniquePatients.length,
        totalEarnings: earningsAgg[0]?.total || 0,
        rating: doctor.rating || 0,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  updateAvailability,
  getDoctorStats,
}
