const mongoose = require("mongoose")

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
)

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
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
    medicines: [medicineSchema],
    diagnosis: { type: String, trim: true },
    advice: { type: String, trim: true },
    fileUrl: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

module.exports = mongoose.model("Prescription", prescriptionSchema)
