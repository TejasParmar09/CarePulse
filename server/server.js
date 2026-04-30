require("dotenv").config()
const express = require("express")
const cors = require("cors")
const path = require("path")
const connectDB = require("./config/db")
const errorHandler = require("./middleware/errorMiddleware")

const authRoutes = require("./routes/authRoutes")
const patientRoutes = require("./routes/patientRoutes")
const doctorRoutes = require("./routes/doctorRoutes")
const appointmentRoutes = require("./routes/appointmentRoutes")
const adminRoutes = require("./routes/adminRoutes")
const paymentRoutes = require("./routes/paymentRoutes")

const app = express()

const allowedOrigins = new Set([
  process.env.CLIENT_URL,
].filter(Boolean))

app.use(  
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server tools (no Origin header) and known frontend origins.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true)
      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Hospital API is running" })
})

app.use("/api/auth", authRoutes)
app.use("/api/patient", patientRoutes)
app.use("/api/doctor", doctorRoutes)
app.use("/api/appointment", appointmentRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/payment", paymentRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
})
