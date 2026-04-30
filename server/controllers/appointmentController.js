const Appointment = require("../models/Appointment")
const Doctor = require("../models/Doctor")
const User = require("../models/User")
const {
  sendEmail,
  appointmentConfirmationEmail,
  appointmentCancellationEmail,
} = require("../utils/sendEmail")

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

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

function formatMinutesToTime(mins) {
  let h24 = Math.floor(mins / 60)
  const m = mins % 60
  const ap = h24 >= 12 ? "PM" : "AM"
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  const mm = m.toString().padStart(2, "0")
  return `${h12}:${mm} ${ap}`
}

function generateSlotStrings(startTime, endTime, durationMins) {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  if (Number.isNaN(start) || Number.isNaN(end) || durationMins <= 0) return []
  const slots = []
  for (let t = start; t + durationMins <= end; t += durationMins) {
    slots.push(formatMinutesToTime(t))
  }
  return slots
}

function slotKey(str) {
  const mins = parseTimeToMinutes(str)
  return Number.isNaN(mins) ? str.trim().toLowerCase() : String(mins)
}

function startOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 0, 0, 0, 0)
}

function endOfDay(d) {
  const x = new Date(d)
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 23, 59, 59, 999)
}

function combineDateAndTimeSlot(appointmentDate, timeSlot) {
  const d = new Date(appointmentDate)
  const mins = parseTimeToMinutes(timeSlot)
  if (Number.isNaN(mins)) return null
  const dt = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    0,
    0,
    0,
    0,
  )
  dt.setMinutes(dt.getMinutes() + mins)
  return dt
}

async function getAvailableSlots(req, res) {
  try {
    const { doctorId, date } = req.query
    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date query params are required",
      })
    }

    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }

    const dayDate = new Date(date)
    if (Number.isNaN(dayDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date" })
    }

    const weekday = WEEKDAY_NAMES[dayDate.getDay()]
    const dayConfig = doctor.availableSlots?.find(
      (s) => s.day === weekday && s.isAvailable !== false,
    )

    if (!dayConfig) {
      return res.json({ success: true, slots: [] })
    }

    const duration = dayConfig.slotDuration || 30
    const allSlots = generateSlotStrings(
      dayConfig.startTime,
      dayConfig.endTime,
      duration,
    )

    const dayStart = startOfDay(dayDate)
    const dayEnd = endOfDay(dayDate)

    const booked = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ["pending", "confirmed"] },
    }).select("timeSlot")

    const bookedKeys = new Set(booked.map((a) => slotKey(a.timeSlot)))

    const available = allSlots.filter((slot) => !bookedKeys.has(slotKey(slot)))

    return res.json({ success: true, slots: available })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load slots",
    })
  }
}

async function bookAppointment(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can book appointments",
      })
    }

    const { doctorId, appointmentDate, timeSlot, type, symptoms } = req.body
    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "doctorId, appointmentDate, and timeSlot are required",
      })
    }

    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }

    const dayDate = new Date(appointmentDate)
    const dayStart = startOfDay(dayDate)
    const dayEnd = endOfDay(dayDate)

    const existing = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This slot is no longer available",
      })
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate: dayStart,
      timeSlot,
      type: type || "consultation",
      symptoms,
      status: "pending",
      paymentStatus: "pending",
      amount: doctor.consultationFee,
    })

    const populated = await Appointment.findById(appointment._id)
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone profileImage",
        },
      })
      .populate("patient", "name email phone")

    return res.status(201).json({
      success: true,
      appointment: populated,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Booking failed",
    })
  }
}

async function confirmAppointmentByIdAndPayment({
  appointmentId,
  paymentId,
  patientId,
}) {
  const query = { _id: appointmentId }
  if (patientId) query.patient = patientId

  const appointment = await Appointment.findOne(query)
    .populate({
      path: "doctor",
      populate: { path: "user", select: "name consultationFee" },
    })
    .populate("patient", "name email")

  if (!appointment) {
    const err = new Error("Appointment not found")
    err.statusCode = 404
    throw err
  }

  if (appointment.status !== "pending" || appointment.paymentStatus !== "pending") {
    const err = new Error("Appointment cannot be confirmed in its current state")
    err.statusCode = 400
    throw err
  }

  appointment.status = "confirmed"
  appointment.paymentStatus = "paid"
  appointment.paymentId = paymentId
  await appointment.save()

  const patientName = appointment.patient?.name || "Patient"
  const doctorName = appointment.doctor?.user?.name || "Doctor"
  const dateStr = new Date(appointment.appointmentDate).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const feeStr = `₹${appointment.amount ?? appointment.doctor?.consultationFee ?? 0}`

  const { subject, html } = appointmentConfirmationEmail({
    patientName,
    doctorName,
    date: dateStr,
    time: appointment.timeSlot,
    fee: feeStr,
  })

  // Email failures should not block payment confirmation.
  try {
    await sendEmail({
      to: appointment.patient.email,
      subject,
      html,
    })
  } catch (emailErr) {
    console.error("Appointment confirmation email failed:", emailErr.message)
  }

  return Appointment.findById(appointment._id)
    .populate({
      path: "doctor",
      populate: {
        path: "user",
        select: "name email phone profileImage",
      },
    })
    .populate("patient", "name email phone")
}

async function confirmAppointmentAfterPayment(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can confirm payment",
      })
    }

    const { appointmentId, paymentId } = req.body
    if (!appointmentId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: "appointmentId and paymentId are required",
      })
    }

    const populated = await confirmAppointmentByIdAndPayment({
      appointmentId,
      paymentId,
      patientId: req.user._id,
    })

    return res.json({
      success: true,
      appointment: populated,
    })
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Confirmation failed",
    })
  }
}

async function getPatientAppointments(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access this resource",
      })
    }

    const { status } = req.query
    const filter = { patient: req.user._id }
    if (status) filter.status = status

    const list = await Appointment.find(filter)
      .populate({
        path: "doctor",
        select: "specialization user",
        populate: { path: "user", select: "name profileImage" },
      })
      .sort({ appointmentDate: -1 })

    return res.json({ success: true, appointments: list })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load appointments",
    })
  }
}

async function getDoctorAppointments(req, res) {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access this resource",
      })
    }

    const doctor = await Doctor.findOne({ user: req.user._id })
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      })
    }

    const dateInput = req.query.date
    const filterDate = dateInput ? new Date(dateInput) : new Date()
    if (Number.isNaN(filterDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date" })
    }

    const dayStart = startOfDay(filterDate)
    const dayEnd = endOfDay(filterDate)

    const list = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
    })
      .populate("patient", "name phone profileImage")
      .sort({ appointmentDate: 1, timeSlot: 1 })

    return res.json({ success: true, appointments: list })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load appointments",
    })
  }
}

async function cancelPatientAppointment(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can cancel appointments",
      })
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })
      .populate({
        path: "doctor",
        populate: { path: "user", select: "name" },
      })
      .populate("patient", "name email")

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      })
    }

    if (!["pending", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending or confirmed appointments can be cancelled",
      })
    }

    appointment.status = "cancelled"
    appointment.cancelReason = req.body?.reason || "Cancelled by patient"
    await appointment.save()

    return res.json({
      success: true,
      message: "Appointment cancelled successfully",
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Cancellation failed",
    })
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const { status, cancelReason } = req.body
    const appointment = await Appointment.findById(req.params.id).populate({
      path: "doctor",
      populate: { path: "user", select: "name" },
    })

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      })
    }

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ user: req.user._id })
      const apptDoctorId =
        appointment.doctor && appointment.doctor._id
          ? appointment.doctor._id
          : appointment.doctor
      if (!doctor || apptDoctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized for this appointment",
        })
      }
      if (status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Doctors can only mark appointments as completed",
        })
      }
      appointment.status = "completed"
    } else if (req.user.role === "admin") {
      const allowedAdminStatuses = [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "rescheduled",
      ]
      if (!allowedAdminStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Admins can set status to pending, confirmed, completed, cancelled, or rescheduled",
        })
      }

      // Treat no-op updates as success so admin UI does not fail on re-apply.
      if (appointment.status === status) {
        const sameStatus = await Appointment.findById(appointment._id)
          .populate({
            path: "doctor",
            populate: { path: "user", select: "name profileImage" },
          })
          .populate("patient", "name phone profileImage email")
        return res.json({ success: true, appointment: sameStatus })
      }

      appointment.status = status
      if (status === "cancelled") {
        appointment.cancelReason = cancelReason || "Cancelled by administration"
        const patient = await User.findById(appointment.patient).select(
          "name email",
        )
        const doctorName = appointment.doctor?.user?.name || "Doctor"
        const { subject, html } = appointmentCancellationEmail({
          patientName: patient?.name || "Patient",
          doctorName,
          reason: appointment.cancelReason,
        })
        if (patient?.email) {
          // Email failures should not block admin cancellation/update.
          try {
            await sendEmail({ to: patient.email, subject, html })
          } catch (emailErr) {
            console.error("Appointment cancellation email failed:", emailErr.message)
          }
        }
      } else {
        appointment.cancelReason = undefined
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    await appointment.save()

    const updated = await Appointment.findById(appointment._id)
      .populate({
        path: "doctor",
        populate: { path: "user", select: "name profileImage" },
      })
      .populate("patient", "name phone profileImage email")

    return res.json({ success: true, appointment: updated })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Update failed",
    })
  }
}

async function rescheduleAppointment(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can reschedule",
      })
    }

    const { appointmentDate, timeSlot } = req.body
    if (!appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "appointmentDate and timeSlot are required",
      })
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      })
    }

    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed appointments can be rescheduled",
      })
    }

    const apptDateTime = combineDateAndTimeSlot(
      appointment.appointmentDate,
      appointment.timeSlot,
    )
    if (!apptDateTime || apptDateTime.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message:
          "Rescheduling is only allowed at least 24 hours before the appointment",
      })
    }

    const doctor = await Doctor.findById(appointment.doctor)
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }

    const newDay = new Date(appointmentDate)
    const newDayStart = startOfDay(newDay)
    const newDayEnd = endOfDay(newDay)

    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      appointmentDate: { $gte: newDayStart, $lte: newDayEnd },
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    })

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "The selected slot is not available",
      })
    }

    const weekday = WEEKDAY_NAMES[newDay.getDay()]
    const dayConfig = doctor.availableSlots?.find(
      (s) => s.day === weekday && s.isAvailable !== false,
    )
    if (dayConfig) {
      const duration = dayConfig.slotDuration || 30
      const validSlots = generateSlotStrings(
        dayConfig.startTime,
        dayConfig.endTime,
        duration,
      )
      const ok = validSlots.some((s) => slotKey(s) === slotKey(timeSlot))
      if (!ok) {
        return res.status(400).json({
          success: false,
          message: "Invalid time slot for this doctor on the selected date",
        })
      }
    }

    appointment.appointmentDate = newDayStart
    appointment.timeSlot = timeSlot
    appointment.status = "pending"
    await appointment.save()

    const populated = await Appointment.findById(appointment._id)
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          select: "name email phone profileImage",
        },
      })
      .populate("patient", "name email phone")

    return res.json({
      success: true,
      appointment: populated,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Reschedule failed",
    })
  }
}

async function addFeedback(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can submit feedback",
      })
    }

    const { rating, comment } = req.body
    const r = Number(rating)
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return res.status(400).json({
        success: false,
        message: "rating must be a number between 1 and 5",
      })
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    })

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      })
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Feedback is only allowed after the appointment is completed",
      })
    }

    if (appointment.feedback && appointment.feedback.rating != null) {
      return res.status(400).json({
        success: false,
        message: "Feedback has already been submitted for this appointment",
      })
    }

    appointment.feedback = {
      rating: r,
      comment: comment || "",
      createdAt: new Date(),
    }
    await appointment.save()

    const doctor = await Doctor.findById(appointment.doctor)
    if (doctor) {
      const prevTotal = doctor.totalRatings || 0
      const prevAvg = doctor.rating || 0
      const newTotal = prevTotal + 1
      doctor.rating = (prevAvg * prevTotal + r) / newTotal
      doctor.totalRatings = newTotal
      await doctor.save()
    }

    const updated = await Appointment.findById(appointment._id)
      .populate({
        path: "doctor",
        select: "rating totalRatings specialization",
      })
      .populate("patient", "name")

    return res.json({
      success: true,
      appointment: updated,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to save feedback",
    })
  }
}

module.exports = {
  getAvailableSlots,
  bookAppointment,
  confirmAppointmentByIdAndPayment,
  confirmAppointmentAfterPayment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelPatientAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  addFeedback,
}
