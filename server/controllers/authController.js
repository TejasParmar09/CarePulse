const User = require("../models/User")
const Doctor = require("../models/Doctor")
const generateToken = require("../utils/generateToken")
const { sendEmail } = require("../utils/sendEmail")

function registrationSuccessEmail({ name, email, role }) {
  const subject = "Welcome to CarePulse — Registration Successful!"
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f0f7ff;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f7ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(37,99,235,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:32px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Welcome to CarePulse!</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Your account has been created successfully</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#1e293b;font-size:16px;line-height:1.6;">Dear <strong>${name}</strong>,</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Congratulations! Your registration as a <strong style="color:#2563eb;text-transform:capitalize;">${role}</strong> on CarePulse has been completed successfully.
              </p>
              <table role="presentation" width="100%" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:24px;">
                <tr><td style="padding:20px;">
                  <p style="margin:0 0 8px;color:#0f172a;font-size:14px;"><strong style="color:#1d4ed8;">Email:</strong> ${email}</p>
                  <p style="margin:0;color:#0f172a;font-size:14px;"><strong style="color:#1d4ed8;">Role:</strong> <span style="text-transform:capitalize;">${role}</span></p>
                </td></tr>
              </table>
              ${role === "patient"
                ? `<p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">You can now log in to find doctors, book appointments, and manage your medical history.</p>`
                : `<p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">Your account is pending verification by our admin team. Once verified, you can start accepting appointments.</p>`
              }
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;">If you did not create this account, please contact our support team immediately.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">CarePulse Hospital Appointment System — Automated notification</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  return { subject, html }
}

function buildLoginUserResponse(userDoc, doctorDoc) {
  const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc }
  const base = {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    profileImage: u.profileImage,
    dateOfBirth: u.dateOfBirth,
    gender: u.gender,
    bloodGroup: u.bloodGroup,
    address: u.address,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }
  if (doctorDoc) {
    const d = doctorDoc.toObject ? doctorDoc.toObject() : doctorDoc
    base.doctor = {
      id: d._id.toString(),
      specialization: d.specialization,
      qualification: d.qualification,
      experience: d.experience,
      consultationFee: d.consultationFee,
      bio: d.bio,
      department: d.department,
      rating: d.rating,
      totalRatings: d.totalRatings,
      isVerified: d.isVerified,
      availableSlots: d.availableSlots,
    }
  }
  return base
}

async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      specialization,
      consultationFee,
      qualification,
      department,
      bio,
    } = req.body

    if (role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin registration is not allowed",
      })
    }

    const userRole = role || "patient"
    if (!["patient", "doctor"].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be patient or doctor",
      })
    }

    const existing = await User.findOne({ email: email?.toLowerCase?.() || email })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      })
    }

    if (userRole === "doctor" && !specialization?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Specialization is required for doctor registration",
      })
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: userRole,
    })

    if (userRole === "doctor") {
      await Doctor.create({
        user: user._id,
        specialization: specialization.trim(),
        consultationFee:
          consultationFee !== undefined && consultationFee !== null
            ? Number(consultationFee)
            : 0,
        qualification,
        department,
        bio,
      })
    }

    const token = generateToken(user._id)

    // Send registration success email (non-blocking)
    try {
      const { subject, html } = registrationSuccessEmail({ name: user.name, email: user.email, role: userRole })
      await sendEmail({ to: user.email, subject, html })
    } catch (_emailErr) {
      // Email failure should not block registration
      console.error("Registration email failed:", _emailErr.message)
    }

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      })
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Registration failed",
    })
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    )
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    const match = await user.comparePassword(password)
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    let doctorDoc = null
    if (user.role === "doctor") {
      doctorDoc = await Doctor.findOne({ user: user._id })
    }

    const token = generateToken(user._id)
    const safeUser = await User.findById(user._id).select("-password")

    return res.json({
      success: true,
      token,
      user: buildLoginUserResponse(safeUser, doctorDoc),
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Login failed",
    })
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password")
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    let doctorDoc = null
    if (user.role === "doctor") {
      doctorDoc = await Doctor.findOne({ user: user._id })
    }

    return res.json({
      success: true,
      user: buildLoginUserResponse(user, doctorDoc),
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load profile",
    })
  }
}

async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const {
      name,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      profileImage,
      bio,
      experience,
      consultationFee,
      qualifications,
    } = req.body

    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (dateOfBirth !== undefined)
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined
    if (gender !== undefined) user.gender = gender
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup
    if (address !== undefined) user.address = address
    if (profileImage !== undefined) user.profileImage = profileImage

    await user.save()

    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ user: user._id })
      if (doctor) {
        if (bio !== undefined) doctor.bio = bio
        if (experience !== undefined) doctor.experience = experience
        if (consultationFee !== undefined)
          doctor.consultationFee = Number(consultationFee)
        if (qualifications !== undefined) doctor.qualification = qualifications
        await doctor.save()
      }
    }

    const fresh = await User.findById(user._id).select("-password")
    let doctorDoc = null
    if (fresh.role === "doctor") {
      doctorDoc = await Doctor.findOne({ user: fresh._id })
    }

    return res.json({
      success: true,
      user: buildLoginUserResponse(fresh, doctorDoc),
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Update failed",
    })
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      })
    }

    const user = await User.findById(req.user._id).select("+password")
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const match = await user.comparePassword(currentPassword)
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    user.password = newPassword
    await user.save()

    return res.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Password change failed",
    })
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
}
