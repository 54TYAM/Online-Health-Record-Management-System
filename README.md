# 🩺 Online Health Record Management System — MediCare

A full-stack **MERN** application for digitising and managing hospital patient records, appointment scheduling, clinical prescriptions, and physician feedback — with role-based dashboards for **Patients**, **Doctors**, and **Admins**.

<img width="1536" height="1024" alt="Thumbnail of MediCare GitHub" src="https://github.com/user-attachments/assets/e754fd47-f0cb-4009-a2cc-345fcef1d6c1" />

---

## 🧠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 3, React Router 7, React Hook Form, Zod, Axios, Lucide Icons |
| **Backend** | Node.js 22, Express 5, Mongoose 9 (MongoDB ODM), JWT Authentication, Helmet, Morgan, Zod Validation |
| **Database** | MongoDB (local or Atlas) |
| **Testing** | Node.js built-in Test Runner (`node --test`) — 38 security & integration tests |

---

## 🚀 Features

### Patient Dashboard
- 🏥 Browse specialists by category (Cardiology, Orthopedics, Dermatology, Neurology, Pediatrics)
- 📅 Book appointments with real-time doctor availability & time slot selection
- 🔄 Reschedule or cancel upcoming consultations
- 📋 View longitudinal medical records & prescription history
- ⭐ Submit feedback only for doctors the patient has actually consulted with

### Doctor Dashboard
- 📊 Clinical overview with appointment statistics & patient ratings
- ✅ Confirm, decline, or complete consultation requests
- 📝 Author diagnosis & prescription records (EHR) for confirmed patients
- 🕐 Configure working days and consultation time slots
- 👤 Edit practitioner profile (specialization, experience, fees, hospital)

### Admin Dashboard
- 👥 View and manage all registered users (patients, doctors, admins)
- 🔒 Block/unblock user accounts (with admin self-block protection)
- 👨‍⚕️ Create new doctor accounts with full profile setup
- 📈 Platform-wide statistics and user analytics

### Security & Authorization
- 🔐 JWT bearer token authentication with secure session management
- 🛡️ Role-based access control (Patient / Doctor / Admin) on every route
- 🏥 Object-level authorization — doctors can only access records of their own patients
- 🚫 Rate limiting to prevent brute-force and DoS attacks
- 🔒 Helmet security headers, CORS whitelisting, 10KB request size limit
- ✅ Zod schema validation on all API inputs (body, query, params)
- 🗓️ Double-booking prevention with unique compound index + conflict detection
- 🔄 Appointment state machine with terminal state protection
- 🧪 38 automated security tests covering auth, role boundaries, record confidentiality, scheduling conflicts, and more

---

## 📁 Project Structure

```
Online-Health-Record-Management-System/
├── MediCare/
│   ├── Backend(Server)/
│   │   ├── src/
│   │   │   ├── config/         # Database & environment configuration
│   │   │   ├── controllers/    # Route handlers (auth, appointments, records, feedback, admin)
│   │   │   ├── middlewares/    # Auth guard, validation, rate limiter, error handler
│   │   │   ├── models/         # Mongoose schemas (User, Doctor, Appointment, MedicalRecord, Feedback, AuditLog)
│   │   │   ├── routes/         # Express route definitions
│   │   │   ├── services/       # Business logic services
│   │   │   ├── validators/     # Zod validation schemas
│   │   │   ├── app.js          # Express app setup (CORS, middleware, routes)
│   │   │   ├── server.js       # Server entry point with env validation
│   │   │   └── seed.js         # Database seeder (admin + 15 specialist doctors)
│   │   ├── test/
│   │   │   └── security.test.js  # 38 automated security & integration tests
│   │   ├── .env.example        # Environment variable template
│   │   └── package.json
│   │
│   └── Frontend(Client)/
│       ├── src/
│       │   ├── api/            # Axios instance with JWT interceptors
│       │   ├── components/     # Navbar, AppLayout, CreateDoctorForm
│       │   ├── context/        # AuthContext (login, logout, session)
│       │   ├── pages/          # Landing, Login, Register, MedicalRecords, NotFound
│       │   │   └── dashboard/  # PatientDashboard, DoctorDashboard, AdminDashboard
│       │   └── utils/          # formatters (doctor name normalisation)
│       ├── index.html
│       ├── tailwind.config.js
│       ├── vite.config.ts
│       └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 📦 Setup & Installation

### Prerequisites
- **Node.js** v18+ (v22 recommended)
- **MongoDB** (local installation or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/54TYAM/Online-Health-Record-Management-System.git
cd Online-Health-Record-Management-System
```

### 2. Backend Setup

```bash
cd MediCare/Backend(Server)
npm install
```

Create a `.env` file from the example template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/medicare
JWT_SECRET=your_secure_random_secret_here
JWT_EXPIRE=30d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

> **Note:** For local MongoDB, use `mongodb://127.0.0.1:27017/medicare`. For Atlas, use your connection string.

### 3. Seed the Database

```bash
npm start
```

On first run, the server automatically seeds the database with:
- 1 Admin account
- 15 Specialist doctors across 5 departments

### 4. Frontend Setup

Open a **new terminal**:

```bash
cd MediCare/Frontend(Client)
npm install
npm run dev
```

### 5. Open in Browser

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5001](http://localhost:5001)

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@medicare.com` | `admin123` |
| **Doctor** | `rajesh.sharma@medicare.com` | `pass123` |
| **Doctor** | `priya.gupta@medicare.com` | `pass123` |
| **Patient** | *(Register via the app)* | *(Your password)* |

> All 15 seeded doctors share the password `pass123`.

---

## 🧪 Running Tests

```bash
cd MediCare/Backend(Server)
npm test
```

Runs **38 automated tests** across 8 security & integration suites:

| Suite | Tests | Coverage |
|-------|-------|----------|
| Authentication & Session Security | 4 | JWT validation, role-based login, blocked user prevention |
| Role-Based Authorization Boundaries | 4 | Cross-role access prevention, admin-only routes |
| Medical Record Confidentiality | 8 | Record ownership, doctor-patient consultation checks |
| Appointment Integrity & State Transitions | 5 | Past-date rejection, terminal state protection, cross-doctor checks |
| Rate Limiting Middleware | 1 | 429 enforcement under high request rates |
| Double-Booking & Admin Safety | 2 | Slot conflict detection, admin self-block prevention |
| Server Startup Environment Guard | 1 | JWT_SECRET validation on boot |
| Scheduling Workflow & Concurrency | 13 | Availability config, slot filtering, reschedule, race conditions |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new patient | — |
| POST | `/api/auth/login` | Login (returns JWT) | — |
| GET | `/api/auth/profile` | Get own profile | 🔒 |
| PUT | `/api/auth/profile` | Update own profile | 🔒 |
| GET | `/api/auth/doctors` | List all doctors | — |

### Appointments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/appointments` | Book appointment | 🔒 Patient |
| GET | `/api/appointments/me` | Get my appointments | 🔒 |
| PUT | `/api/appointments/:id/status` | Update status (confirm/complete/cancel) | 🔒 Doctor |
| POST | `/api/appointments/:id/reschedule` | Reschedule appointment | 🔒 Patient |
| PUT | `/api/appointments/availability` | Set doctor schedule | 🔒 Doctor |
| GET | `/api/appointments/availability/:doctorId` | Check available slots | 🔒 |

### Medical Records
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/records` | Create medical record | 🔒 Doctor |
| GET | `/api/records/me` | Get patient's records | 🔒 |
| GET | `/api/records/:id` | Get single record | 🔒 |

### Feedback
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/feedback` | Submit doctor feedback | 🔒 Patient |
| GET | `/api/feedback/me` | Get my feedback | 🔒 |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users | 🔒 Admin |
| PUT | `/api/admin/users/:id/block` | Block/unblock user | 🔒 Admin |
| POST | `/api/admin/doctors` | Create doctor account | 🔒 Admin |

---

## 🏗️ Architecture

```
┌──────────────────┐         HTTP/REST + JWT          ┌──────────────────┐
│                  │  ─────────────────────────────►  │                  │
│   React SPA      │         Port 5173                │  Express API     │
│   (Vite)         │  ◄─────────────────────────────  │  Server          │
│                  │         JSON Responses            │  Port 5001       │
└──────────────────┘                                  └────────┬─────────┘
                                                               │
                                                               │ Mongoose ODM
                                                               ▼
                                                      ┌──────────────────┐
                                                      │    MongoDB       │
                                                      │    Port 27017    │
                                                      └──────────────────┘
```

- **Frontend → Backend:** Axios HTTP client with automatic JWT token injection via request interceptors
- **CORS:** Backend whitelists `http://localhost:5173` for cross-origin requests
- **Session:** JWT stored in `sessionStorage`; auto-cleared on 401 responses

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Satyam Yadav** — [@54TYAM](https://github.com/54TYAM)
