const express = require("express")
const {
  createOrder,
  verifyPayment,
  dummyPay,
} = require("../controllers/paymentController")
const { verifyToken } = require("../middleware/authMiddleware")
const { requireRole } = require("../middleware/roleMiddleware")

const router = express.Router()

router.post("/create-order", verifyToken, requireRole("patient"), createOrder)
router.post("/verify", verifyToken, requireRole("patient"), verifyPayment)
router.post("/dummy-pay", verifyToken, requireRole("patient"), dummyPay)

module.exports = router
