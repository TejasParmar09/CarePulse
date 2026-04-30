const Appointment = require("../models/Appointment")
const Doctor = require("../models/Doctor")
const User = require("../models/User")
const { sendEmail } = require("../utils/sendEmail")

function startOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 0, 0, 0, 0)
}

function endOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999)
}

function parseTimeToMinutes(str) {
  if (!str || typeof str !== "string") return NaN
  const s = str.trim().toUpperCase().replace(/\s+/g, " ")
  const match = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (!match) return NaN
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const ap = match[3]
  if (ap === "PM" && h !== 12) h += 12
  if (ap === "AM" && h === 12) h = 0
  return h * 60 + m
}

function getAppointmentDateTime(appointmentDate, timeSlot) {
  const d = new Date(appointmentDate)
  if (Number.isNaN(d.getTime())) return null
  const mins = parseTimeToMinutes(timeSlot)
  if (Number.isNaN(mins)) return d
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  dt.setMinutes(mins)
  return dt
}

function getEffectiveAppointmentStatus(a) {
  if (!a) return "pending"
  if (a.status !== "pending") return a.status
  const dt = getAppointmentDateTime(a.appointmentDate, a.timeSlot)
  if (!dt) return a.status
  return dt < new Date() ? "expired" : a.status
}

async function addDoctor(req, res) {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      qualification,
      experience,
      consultationFee,
      bio,
      department,
      availableSlots,
      profileImage,
      isVerified,
    } = req.body

    const existing = await User.findOne({ email: email?.toLowerCase() })
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" })
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "doctor",
      profileImage,
    })

    const doctor = await Doctor.create({
      user: user._id,
      specialization,
      qualification,
      experience,
      consultationFee,
      bio,
      department,
      availableSlots: Array.isArray(availableSlots) ? availableSlots : [],
      isVerified: Boolean(isVerified),
    })

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Hospital Appointment System",
        html: `<div style="font-family:Arial,sans-serif;color:#0f172a"><h2>Welcome Dr. ${
          user.name
        }</h2><p>Your doctor account has been created.</p><p>Specialization: ${
          doctor.specialization
        }</p></div>`,
      })
    }

    return res.status(201).json({ success: true, doctor })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function getAllDoctors(req, res) {
  try {
    const doctors = await Doctor.find({})
      .populate("user", "name email phone profileImage isActive createdAt")
      .sort({ createdAt: -1 })
    return res.json({ success: true, doctors })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function updateDoctor(req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }

    const user = await User.findById(doctor.user).select("-password")
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const {
      name,
      phone,
      gender,
      profileImage,
      specialization,
      qualification,
      experience,
      consultationFee,
      bio,
      department,
      isVerified,
      isActive,
    } = req.body

    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (gender !== undefined) user.gender = gender
    if (profileImage !== undefined) user.profileImage = profileImage
    if (isActive !== undefined) user.isActive = Boolean(isActive)
    await user.save()

    if (specialization !== undefined) doctor.specialization = specialization
    if (qualification !== undefined) doctor.qualification = qualification
    if (experience !== undefined) doctor.experience = Number(experience)
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee)
    if (bio !== undefined) doctor.bio = bio
    if (department !== undefined) doctor.department = department
    if (isVerified !== undefined) doctor.isVerified = Boolean(isVerified)
    await doctor.save()

    const populated = await Doctor.findById(doctor._id).populate(
      "user",
      "name email phone profileImage isActive createdAt gender",
    )

    return res.json({ success: true, doctor: populated })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function verifyDoctor(req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }
    doctor.isVerified = !doctor.isVerified
    await doctor.save()
    return res.json({ success: true, doctor })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function deleteDoctor(req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }
    const user = await User.findById(doctor.user)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
    user.isActive = false
    await user.save()
    return res.json({ success: true, message: "Doctor soft-deleted" })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function getAllAppointments(req, res) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100)
    const { status, date, doctor } = req.query

    const filter = {}
    if (doctor) filter.doctor = doctor
    if (date) filter.appointmentDate = { $gte: startOfDay(date), $lte: endOfDay(date) }

    const query = Appointment.find({
      ...filter,
      ...(status === "expired" ? { status: "pending" } : status ? { status } : {}),
    })
      .populate("patient", "name email phone")
      .populate({
        path: "doctor",
        select: "specialization user",
        populate: { path: "user", select: "name email" },
      })
      .sort({ appointmentDate: -1, createdAt: -1 })

    const needsEffectiveFilter = status === "pending" || status === "expired"

    let total = 0
    let normalizedAppointments = []

    if (needsEffectiveFilter) {
      const allMatchingPending = await query
      const normalized = allMatchingPending.map((a) => {
        const obj = a.toObject()
        return { ...obj, status: getEffectiveAppointmentStatus(obj) }
      })
      const filtered = normalized.filter((a) => a.status === status)
      total = filtered.length
      normalizedAppointments = filtered.slice((page - 1) * limit, page * limit)
    } else {
      const [appointments, dbTotal] = await Promise.all([
        query.skip((page - 1) * limit).limit(limit),
        Appointment.countDocuments({
          ...filter,
          ...(status ? { status } : {}),
        }),
      ])
      total = dbTotal
      normalizedAppointments = appointments.map((a) => {
        const obj = a.toObject()
        return { ...obj, status: getEffectiveAppointmentStatus(obj) }
      })
    }

    return res.json({
      success: true,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      appointments: normalizedAppointments,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function getRecentPatients(req, res) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const limitQuery = req.query.limit
    const fetchAll = limitQuery === "all" || Number(limitQuery) === 0
    const limit = fetchAll ? 0 : Math.min(Math.max(Number(limitQuery || 10), 1), 100)

    const filter = { role: "patient", isActive: { $ne: false } }

    const total = await User.countDocuments(filter)
    const query = User.find(filter)
      .select("name email phone gender bloodGroup createdAt isActive")
      .sort({ createdAt: -1 })

    if (!fetchAll) {
      query.skip((page - 1) * limit).limit(limit)
    }

    const patients = await query

    return res.json({
      success: true,
      pagination: {
        page,
        limit: fetchAll ? total : limit,
        total,
        pages: fetchAll ? 1 : Math.ceil(total / limit),
      },
      patients,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function getDashboardStats(req, res) {
  try {
    const dayStart = startOfDay(new Date())
    const dayEnd = endOfDay(new Date())
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      revenueAgg,
      statusSourceAppointments,
      recentAppointments,
    ] = await Promise.all([
      User.countDocuments({ role: "patient", isActive: true }),
      Doctor.countDocuments({}),
      Appointment.countDocuments({}),
      Appointment.countDocuments({
        appointmentDate: { $gte: dayStart, $lte: dayEnd },
      }),
      Appointment.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
      ]),
      Appointment.find({}).select("status paymentStatus appointmentDate timeSlot"),
      Appointment.find({})
        .populate("patient", "name")
        .populate({
          path: "doctor",
          select: "specialization user",
          populate: { path: "user", select: "name" },
        })
        .sort({ createdAt: -1 })
        .limit(5),
    ])

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
      expired: 0,
    }
    const paymentCounts = {
      pending: 0,
      paid: 0,
      refunded: 0,
    }

    for (const appt of statusSourceAppointments) {
      const s = getEffectiveAppointmentStatus(appt)
      statusCounts[s] = (statusCounts[s] || 0) + 1
      const p = appt.paymentStatus || "pending"
      paymentCounts[p] = (paymentCounts[p] || 0) + 1
    }

    const appointmentsByStatus = Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ status, count }))

    const normalizedRecentAppointments = recentAppointments.map((a) => {
      const obj = a.toObject()
      return { ...obj, status: getEffectiveAppointmentStatus(obj) }
    })

    return res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        todayAppointments,
        totalRevenue: revenueAgg[0]?.total || 0,
        statusCounts,
        paymentCounts,
        appointmentsByStatus,
        recentAppointments: normalizedRecentAppointments,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function manageSchedule(req, res) {
  try {
    const { availableSlots } = req.body
    if (!Array.isArray(availableSlots)) {
      return res
        .status(400)
        .json({ success: false, message: "availableSlots must be an array" })
    }
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { availableSlots },
      { new: true, runValidators: true },
    )
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }
    return res.json({ success: true, doctor })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function getAnalytics(req, res) {
  try {
    const from = req.query.from ? new Date(req.query.from) : null
    const to = req.query.to ? new Date(req.query.to) : null

    const dateFilter = {}
    if (from && !Number.isNaN(from.getTime())) dateFilter.$gte = from
    if (to && !Number.isNaN(to.getTime())) dateFilter.$lte = to

    const matchAppt = {}
    if (Object.keys(dateFilter).length) matchAppt.appointmentDate = dateFilter

    const revenueByDay = await Appointment.aggregate([
      { $match: { ...matchAppt, paymentStatus: "paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } },
          total: { $sum: { $ifNull: ["$amount", 0] } },
        },
      },
      { $project: { _id: 0, day: "$_id", total: 1 } },
      { $sort: { day: 1 } },
    ])

    const appointmentsByDepartment = await Appointment.aggregate([
      { $match: matchAppt },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorDoc",
        },
      },
      { $unwind: "$doctorDoc" },
      {
        $group: {
          _id: { $ifNull: ["$doctorDoc.department", "General"] },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, department: "$_id", count: 1 } },
      { $sort: { count: -1 } },
    ])

    const doctorPerformance = await Appointment.aggregate([
      { $match: matchAppt },
      {
        $group: {
          _id: "$doctor",
          totalAppointments: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, { $ifNull: ["$amount", 0] }, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctorDoc",
        },
      },
      { $unwind: "$doctorDoc" },
      {
        $lookup: {
          from: "users",
          localField: "doctorDoc.user",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: "$userDoc" },
      {
        $project: {
          _id: 0,
          doctorId: "$doctorDoc._id",
          name: "$userDoc.name",
          specialization: "$doctorDoc.specialization",
          totalAppointments: 1,
          revenue: 1,
          rating: { $ifNull: ["$doctorDoc.rating", 0] },
        },
      },
      { $sort: { totalAppointments: -1 } },
      { $limit: 50 },
    ])

    const patientGrowth = await User.aggregate([
      {
        $match: {
          role: "patient",
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, day: "$_id", count: 1 } },
      { $sort: { day: 1 } },
    ])

    return res.json({
      success: true,
      analytics: {
        revenueByDay,
        appointmentsByDepartment,
        doctorPerformance,
        patientGrowth,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = {
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
}
