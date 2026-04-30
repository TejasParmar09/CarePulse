const mongoose = require("mongoose")

const feedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "rescheduled"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["consultation", "follow-up", "emergency"],
    },
    symptoms: { type: String, trim: true },
    notes: { type: String, trim: true },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentId: { type: String, trim: true },
    amount: { type: Number, min: 0 },
    feedback: feedbackSchema,
    cancelReason: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

module.exports = mongoose.model("Appointment", appointmentSchema)
