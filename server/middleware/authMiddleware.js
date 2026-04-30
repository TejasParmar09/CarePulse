const jwt = require("jsonwebtoken")
const User = require("../models/User")

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id || decoded.userId || decoded.sub

    const user = await User.findById(userId).select("-password")
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" })
  }
}

module.exports = { verifyToken }
