# 🏥 CarePulse — Hospital Appointment System

A full-stack MERN hospital appointment platform with modern UI, secure payments, and role-based dashboards.

## 🚀 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + Role-based access
- **Payments**: Razorpay integration
- **File Upload**: Cloudinary

## 🎯 Features

- 🔐 Role-based auth (Patient / Doctor / Admin)
- 📅 Appointment booking with time slots
- 💳 Secure Razorpay payment checkout
- 🏥 Doctor profiles with specialization & rating
- 📋 Digital prescriptions
- 📊 Admin analytics dashboard
- 📧 Email notifications

## ⚙️ Setup

### Server
\`\`\`bash
cd server
npm install
cp .env.example .env   # add your credentials
npm run dev
\`\`\`

### Client
\`\`\`bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev
\`\`\`

## 🌐 Routes

| Role    | Dashboard              |
|---------|------------------------|
| Patient | /patient/dashboard     |
| Doctor  | /doctor/dashboard      |
| Admin   | /admin/dashboard       |
