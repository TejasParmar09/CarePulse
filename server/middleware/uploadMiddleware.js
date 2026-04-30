const multer = require("multer")
const { diskStorage } = require("../config/storage")

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Only JPG, PNG and PDF files are allowed"), false)
    }
  },
})

const uploadSingle = upload.single("prescription")

module.exports = { upload, uploadSingle }
