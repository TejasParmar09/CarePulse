require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") })
const mongoose = require("mongoose")

const User = require("../models/User")
const Doctor = require("../models/Doctor")
const Appointment = require("../models/Appointment")
const Prescription = require("../models/Prescription")
const Payment = require("../models/Payment")

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function monToSatAvailability() {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => ({
    day,
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    slotDuration: 30,
    isAvailable: true,
  }))
}

async function removeExistingSeedData() {
  const seedEmails = [
    "admin@medicare.com",
    "dr.priya@medicare.com",
    "dr.rahul@medicare.com",
    "dr.anita@medicare.com",
    "dr.vijay@medicare.com",
    "dr.sneha@medicare.com",
    "patient1@test.com",
    "patient2@test.com",
  ]

  const users = await User.find({ email: { $in: seedEmails } }).select("_id")
  const userIds = users.map((u) => u._id)
  const doctors = await Doctor.find({ user: { $in: userIds } }).select("_id")
  const doctorIds = doctors.map((d) => d._id)
  const appointments = await Appointment.find({
    $or: [{ patient: { $in: userIds } }, { doctor: { $in: doctorIds } }],
  }).select("_id")
  const appointmentIds = appointments.map((a) => a._id)

  await Prescription.deleteMany({
    $or: [
      { appointment: { $in: appointmentIds } },
      { patient: { $in: userIds } },
      { doctor: { $in: doctorIds } },
    ],
  })
  await Payment.deleteMany({
    $or: [{ appointment: { $in: appointmentIds } }, { patient: { $in: userIds } }],
  })
  await Appointment.deleteMany({ _id: { $in: appointmentIds } })
  await Doctor.deleteMany({ _id: { $in: doctorIds } })
  await User.deleteMany({ _id: { $in: userIds } })
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env")
  }

  await mongoose.connect(process.env.MONGO_URI)
  console.log("Connected to MongoDB")

  await removeExistingSeedData()

  // 1) Admin
  const admin = await User.create({
    name: "MediCare Admin",
    email: "admin@medicare.com",
    password: "Admin@123",
    role: "admin",
    phone: "9000000000",
    gender: "other",
  })

  // 2) Doctors
  const doctorSeeds = [
    {
      name: "Dr. Priya Sharma",
      email: "dr.priya@medicare.com",
      specialization: "Cardiology",
      experience: 10,
      consultationFee: 800,
      qualification: "MBBS, MD (Cardiology)",
      department: "Cardiology",
      bio: "Experienced cardiologist focused on preventive and interventional care.",
    },
    {
      name: "Dr. Rahul Mehta",
      email: "dr.rahul@medicare.com",
      specialization: "Orthopedics",
      experience: 8,
      consultationFee: 600,
      qualification: "MBBS, MS (Orthopedics)",
      department: "Orthopedics",
      bio: "Orthopedic specialist with interest in sports injuries and joint care.",
    },
    {
      name: "Dr. Anita Patel",
      email: "dr.anita@medicare.com",
      specialization: "Dermatology",
      experience: 6,
      consultationFee: 500,
      qualification: "MBBS, MD (Dermatology)",
      department: "Dermatology",
      bio: "Dermatologist treating chronic skin disorders and cosmetic concerns.",
    },
    {
      name: "Dr. Vijay Krishnan",
      email: "dr.vijay@medicare.com",
      specialization: "Neurology",
      experience: 12,
      consultationFee: 1000,
      qualification: "MBBS, DM (Neurology)",
      department: "Neurology",
      bio: "Neurologist with expertise in headache, stroke and seizure management.",
    },
    {
      name: "Dr. Sneha Joshi",
      email: "dr.sneha@medicare.com",
      specialization: "Pediatrics",
      experience: 5,
      consultationFee: 400,
      qualification: "MBBS, MD (Pediatrics)",
      department: "Pediatrics",
      bio: "Pediatrician dedicated to child growth, nutrition and preventive care.",
    },
  ]

  const doctorProfiles = []
  for (const seed of doctorSeeds) {
    const user = await User.create({
      name: seed.name,
      email: seed.email,
      password: "Doctor@123",
      role: "doctor",
      phone: "9000000000",
      gender: "other",
      isActive: true,
    })
    const doctor = await Doctor.create({
      user: user._id,
      specialization: seed.specialization,
      qualification: seed.qualification,
      experience: seed.experience,
      consultationFee: seed.consultationFee,
      bio: seed.bio,
      availableSlots: monToSatAvailability(),
      isVerified: true,
      department: seed.department,
      rating: 4.5,
      totalRatings: 10,
    })
    doctorProfiles.push({ user, doctor })
  }

  // 3) Patients
  const patient1 = await User.create({
    name: "Patient One",
    email: "patient1@test.com",
    password: "Patient@123",
    role: "patient",
    phone: "9111111111",
    gender: "male",
    bloodGroup: "B+",
  })

  const patient2 = await User.create({
    name: "Patient Two",
    email: "patient2@test.com",
    password: "Patient@123",
    role: "patient",
    phone: "9222222222",
    gender: "female",
    bloodGroup: "O+",
  })

  // 4) Completed appointments + prescriptions
  const sampleAppointments = [
    {
      patient: patient1._id,
      doctor: doctorProfiles[0].doctor._id,
      appointmentDate: daysAgo(12),
      timeSlot: "10:00 AM",
      type: "consultation",
      symptoms: "Mild chest discomfort and fatigue",
      notes: "ECG reviewed",
      amount: 944,
    },
    {
      patient: patient2._id,
      doctor: doctorProfiles[1].doctor._id,
      appointmentDate: daysAgo(8),
      timeSlot: "11:30 AM",
      type: "follow-up",
      symptoms: "Knee pain during walking",
      notes: "Suggested physiotherapy",
      amount: 708,
    },
    {
      patient: patient1._id,
      doctor: doctorProfiles[2].doctor._id,
      appointmentDate: daysAgo(4),
      timeSlot: "2:00 PM",
      type: "consultation",
      symptoms: "Acne flare-up and itching",
      notes: "Skin routine advised",
      amount: 590,
    },
  ]

  for (const a of sampleAppointments) {
    const appointment = await Appointment.create({
      patient: a.patient,
      doctor: a.doctor,
      appointmentDate: a.appointmentDate,
      timeSlot: a.timeSlot,
      status: "completed",
      type: a.type,
      symptoms: a.symptoms,
      notes: a.notes,
      paymentStatus: "paid",
      paymentId: `seed_pay_${Math.random().toString(36).slice(2, 10)}`,
      amount: a.amount,
    })

    const prescription = await Prescription.create({
      appointment: appointment._id,
      patient: a.patient,
      doctor: a.doctor,
      diagnosis: "Stable condition. Continue medication and follow lifestyle advice.",
      advice: "Hydration, regular sleep, and follow-up after 2 weeks.",
      medicines: [
        {
          name: "Paracetamol",
          dosage: "500mg",
          frequency: "Twice a day",
          duration: "3 days",
          notes: "After meals",
        },
        {
          name: "Vitamin D3",
          dosage: "60k IU",
          frequency: "Weekly",
          duration: "4 weeks",
          notes: "",
        },
      ],
      fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    })

    appointment.prescription = prescription._id
    await appointment.save()
  }

  console.log("Seed completed successfully")
  console.table([
    { role: "admin", email: admin.email, password: "Admin@123" },
    { role: "doctor", email: "dr.priya@medicare.com", password: "Doctor@123" },
    { role: "doctor", email: "dr.rahul@medicare.com", password: "Doctor@123" },
    { role: "doctor", email: "dr.anita@medicare.com", password: "Doctor@123" },
    { role: "doctor", email: "dr.vijay@medicare.com", password: "Doctor@123" },
    { role: "doctor", email: "dr.sneha@medicare.com", password: "Doctor@123" },
    { role: "patient", email: "patient1@test.com", password: "Patient@123" },
    { role: "patient", email: "patient2@test.com", password: "Patient@123" },
  ])
}

run()
  .catch((err) => {
    console.error("Seed failed:", err.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.connection.close()
    console.log("MongoDB connection closed")
  })

