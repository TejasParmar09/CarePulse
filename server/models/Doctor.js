const mongoose = require("mongoose")

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

const availableSlotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: weekdays, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDuration: { type: Number, default: 30, min: 1 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false },
)

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    specialization: { type: String, required: true, trim: true },
    qualification: { type: String, trim: true },
    experience: { type: Number, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    bio: { type: String, trim: true },
    availableSlots: [availableSlotSchema],
    rating: { type: Number, default: 0, min: 0 },
    totalRatings: { type: Number, default: 0, min: 0 },
    isVerified: { type: Boolean, default: false },
    department: { type: String, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Doctor", doctorSchema)
