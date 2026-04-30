const crypto = require("crypto")
const Appointment = require("../models/Appointment")
const Doctor = require("../models/Doctor")
const Payment = require("../models/Payment")
const getRazorpayClient = require("../services/razorpayService")
const {
  confirmAppointmentByIdAndPayment,
} = require("./appointmentController")

async function createOrder(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ success: false, message: "Only patients allowed" })
    }

    const { appointmentId } = req.body
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "appointmentId is required" })
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user._id,
    })
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" })
    }

    const doctor = await Doctor.findById(appointment.doctor)
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }

    const fee = Number(doctor.consultationFee || appointment.amount || 0)
    const gst = Math.round(fee * 0.18 * 100) / 100
    const amount = Math.round((fee + gst) * 100) / 100
    const razorpay = getRazorpayClient()
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `appt_${appointment._id.toString().slice(-10)}`,
    })

    await Payment.create({
      appointment: appointment._id,
      patient: req.user._id,
      razorpayOrderId: order.id,
      amount,
      currency: order.currency || "INR",
      status: "created",
    })

    appointment.amount = amount
    await appointment.save()

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      fee,
      gst,
      total: amount,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function verifyPayment(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ success: false, message: "Only patients allowed" })
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      appointmentId,
    } = req.body

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !appointmentId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "razorpayOrderId, razorpayPaymentId, razorpaySignature, and appointmentId are required",
      })
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex")

    if (generatedSignature !== razorpaySignature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" })
    }

    const payment = await Payment.findOne({
      razorpayOrderId,
      appointment: appointmentId,
      patient: req.user._id,
    })
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" })
    }

    payment.razorpayPaymentId = razorpayPaymentId
    payment.razorpaySignature = razorpaySignature
    payment.status = "paid"
    await payment.save()

    const appointment = await confirmAppointmentByIdAndPayment({
      appointmentId,
      paymentId: razorpayPaymentId,
      patientId: req.user._id,
    })

    return res.json({ success: true, payment, appointment })
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Payment verification failed",
    })
  }
}

async function dummyPay(req, res) {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ success: false, message: "Only patients allowed" })
    }

    const { appointmentId } = req.body
    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "appointmentId is required" })
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user._id,
    })
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" })
    }

    if (appointment.paymentStatus === "paid" || appointment.status === "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already paid/confirmed",
      })
    }

    const paymentId = `DUMMY_PAY_${Date.now()}`

    await Payment.create({
      appointment: appointment._id,
      patient: req.user._id,
      amount: Number(appointment.amount || 0),
      currency: "INR",
      status: "paid",
      razorpayOrderId: `dummy_order_${appointment._id.toString().slice(-8)}`,
      razorpayPaymentId: paymentId,
      razorpaySignature: "dummy_signature",
    })

    const updatedAppointment = await confirmAppointmentByIdAndPayment({
      appointmentId,
      paymentId,
      patientId: req.user._id,
    })

    return res.json({
      success: true,
      message: "Dummy payment successful. Appointment confirmed.",
      appointment: updatedAppointment,
    })
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Dummy payment failed",
    })
  }
}

module.exports = { createOrder, verifyPayment, dummyPay }
