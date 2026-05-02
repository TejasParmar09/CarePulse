require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();


// ✅ CORS FIX (ONLY THIS ONE)
const allowedOrigins = [
  process.env.CLIENT_URL, // from .env
  "https://care-pulse-beryl.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
}));


// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Hospital API is running" });
});


// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);


// ✅ Error handler
app.use(errorHandler);


// ✅ Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});