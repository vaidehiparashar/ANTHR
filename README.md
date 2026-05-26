# HR Antbox — Backend API

A production-grade HR Management System backend built with Node.js, Express, PostgreSQL, Prisma ORM, JWT authentication, and Socket.io.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | PostgreSQL 14+ |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.io |
| PDF | PDFKit |
| Logging | Winston |
| Validation | express-validator |
| Security | Helmet, CORS, Rate Limiting |

---

## 📁 Project Structure

```
hr-antbox/
├── prisma/
│   ├── schema.prisma          # Full database schema (18 models)
│   └── seed.js                # Realistic demo data seeder
├── src/
│   ├── controllers/           # Business logic per domain
│   │   ├── auth.controller.js
│   │   ├── employee.controller.js
│   │   ├── attendance.controller.js
│   │   ├── leave.controller.js
│   │   ├── payroll.controller.js
│   │   ├── recruitment.controller.js
│   │   ├── internship.controller.js
│   │   ├── notification.controller.js
│   │   └── department.controller.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verify + RBAC
│   │   ├── errorHandler.js    # Global error handler
│   │   └── validate.js        # express-validator helper
│   ├── routes/                # Express routers
│   ├── services/
│   │   ├── notification.service.js  # Socket + DB notifications
│   │   └── payroll.service.js       # PDF payslip generation
│   ├── socket/
│   │   └── socket.js          # Socket.io setup & events
│   ├── utils/
│   │   ├── prisma.js          # Prisma client singleton
│   │   ├── jwt.js             # Token generation & verification
│   │   ├── logger.js          # Winston logger
│   │   └── response.js        # Standardised API responses
│   ├── app.js                 # Express app config
│   └── server.js              # HTTP + Socket server entry
├── logs/                      # Auto-created by Winston
├── uploads/                   # File uploads directory
├── .env.example
└── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install
```bash
cd hr-antbox
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/hr_antbox"
JWT_SECRET=your-super-secret-minimum-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-chars
```

### 3. Set Up Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Run the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:3000`

---

## 🔐 Authentication

All protected endpoints require a Bearer token:
```
Authorization: Bearer <access_token>
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@hrantbox.com",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": { "id": "...", "role": "SUPER_ADMIN", ... }
  }
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
{ "refreshToken": "eyJhbG..." }
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@hrantbox.com | Password@123 |
| HR Admin | hr.manager@hrantbox.com | Password@123 |
| Manager (CTO) | cto@hrantbox.com | Password@123 |
| Senior Engineer | senior.dev1@hrantbox.com | Password@123 |
| HR Specialist | hr.specialist@hrantbox.com | Password@123 |
| Recruiter | recruiter@hrantbox.com | Password@123 |
| Intern | intern1@hrantbox.com | Password@123 |

---

## 🛡️ Role-Based Access Control

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full system access |
| `HR_ADMIN` | HR operations, payroll, employees |
| `MANAGER` | View team, approve leaves |
| `EMPLOYEE` | Own data, attendance, leaves |
| `RECRUITER` | Job postings, applications |
| `INTERN` | Limited employee access |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | ❌ | Login |
| POST | `/api/v1/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/v1/auth/logout` | ✅ | Logout |
| GET | `/api/v1/auth/me` | ✅ | Get own profile |
| PATCH | `/api/v1/auth/change-password` | ✅ | Change password |

### Employees
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/employees` | HR_ADMIN+ | List all employees |
| GET | `/api/v1/employees/stats` | HR_ADMIN+ | Employee statistics |
| GET | `/api/v1/employees/:id` | Self/Manager+ | Get employee detail |
| POST | `/api/v1/employees` | HR_ADMIN+ | Create employee |
| PUT | `/api/v1/employees/:id` | HR_ADMIN+ | Update employee |
| DELETE | `/api/v1/employees/:id` | HR_ADMIN+ | Terminate employee |

### Attendance
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/attendance/clock-in` | All | Clock in (records in-time) |
| POST | `/api/v1/attendance/clock-out` | All | Clock out (records out-time) |
| GET | `/api/v1/attendance/today` | All | Today's attendance |
| GET | `/api/v1/attendance/my` | All | Own attendance history |
| GET | `/api/v1/attendance` | Manager+ | All attendance records |
| POST | `/api/v1/attendance/manual` | HR_ADMIN+ | Manual attendance entry |
| GET | `/api/v1/attendance/summary` | Manager+ | Monthly summary |

#### Clock-In Request
```json
POST /api/v1/attendance/clock-in
{ "location": "Main Office - Floor 3" }
```

#### Clock-In Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2025-05-26",
    "clockIn": "2025-05-26T09:05:00Z",
    "inTime": "09:05 AM",
    "status": "PRESENT",
    "isLate": false
  }
}
```

### Leaves
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/leaves` | All | Submit leave request |
| GET | `/api/v1/leaves/my` | All | Own leave requests + balances |
| GET | `/api/v1/leaves/balances/my` | All | Own leave balances |
| GET | `/api/v1/leaves` | Manager+ | All leave requests |
| PATCH | `/api/v1/leaves/:id/action` | Manager+ | Approve or reject |
| PATCH | `/api/v1/leaves/:id/cancel` | Self | Cancel pending request |

#### Request Leave
```json
POST /api/v1/leaves
{
  "leaveType": "ANNUAL",
  "startDate": "2025-06-10",
  "endDate": "2025-06-13",
  "reason": "Family vacation",
  "isUrgent": false
}
```

#### Approve/Reject Leave
```json
PATCH /api/v1/leaves/:id/action
{
  "action": "approve",          // or "reject"
  "rejectReason": "..."         // required if rejecting
}
```

### Payroll
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/payroll/my` | All | Own payroll history |
| GET | `/api/v1/payroll/:id/receipt` | Self/HR | Download PDF payslip |
| GET | `/api/v1/payroll` | HR_ADMIN+ | All payroll records |
| POST | `/api/v1/payroll/process` | HR_ADMIN+ | Process single payroll |
| POST | `/api/v1/payroll/bulk-process` | HR_ADMIN+ | Bulk process payroll |
| PATCH | `/api/v1/payroll/:id/mark-paid` | HR_ADMIN+ | Mark as paid |
| PATCH | `/api/v1/payroll/salary` | HR_ADMIN+ | Update employee salary |
| GET | `/api/v1/payroll/salary-revisions/:empId` | HR_ADMIN+ | Salary revision history |

#### Process Payroll
```json
POST /api/v1/payroll/process
{
  "employeeId": "uuid",
  "month": 5,
  "year": 2025,
  "allowances": 500,
  "bonus": 1000,
  "otherDeductions": 0,
  "notes": "May 2025 payroll"
}
```

#### Update Salary
```json
PATCH /api/v1/payroll/salary
{
  "employeeId": "uuid",
  "newSalary": 12000,
  "effectiveDate": "2025-06-01",
  "reason": "Annual performance review"
}
```

### Recruitment
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/recruitment/jobs` | All | List job postings |
| POST | `/api/v1/recruitment/jobs` | HR/Recruiter | Create job posting |
| GET | `/api/v1/recruitment/jobs/:id` | All | Job posting detail |
| PUT | `/api/v1/recruitment/jobs/:id` | HR/Recruiter | Update job posting |
| POST | `/api/v1/recruitment/apply` | All | Submit application |
| GET | `/api/v1/recruitment/applications` | HR/Recruiter | All applications |
| PATCH | `/api/v1/recruitment/applications/:id/status` | HR/Recruiter | Update status |
| POST | `/api/v1/recruitment/interviews` | HR/Recruiter | Schedule interview |
| PATCH | `/api/v1/recruitment/interviews/:id/feedback` | Manager+ | Submit feedback |
| GET | `/api/v1/recruitment/stats` | HR/Recruiter | Recruitment stats |

### Internships
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/internships` | Manager+ | List internships |
| GET | `/api/v1/internships/stats` | HR_ADMIN+ | Internship statistics |
| GET | `/api/v1/internships/:id` | All | Internship detail |
| POST | `/api/v1/internships` | HR_ADMIN+ | Create internship record |
| PUT | `/api/v1/internships/:id` | HR_ADMIN+ | Update (evaluate, convert) |

### Notifications
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/notifications` | All | Own notifications |
| GET | `/api/v1/notifications/announcements` | All | Company announcements |
| PATCH | `/api/v1/notifications/:id/read` | All | Mark as read |
| PATCH | `/api/v1/notifications/read-all` | All | Mark all as read |
| DELETE | `/api/v1/notifications/:id` | All | Delete notification |
| POST | `/api/v1/notifications/announcements` | HR_ADMIN+ | Send announcement |

### Departments
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/departments` | All | List departments |
| GET | `/api/v1/departments/:id` | All | Department with employees |
| POST | `/api/v1/departments` | HR_ADMIN+ | Create department |
| PUT | `/api/v1/departments/:id` | HR_ADMIN+ | Update department |
| DELETE | `/api/v1/departments/:id` | SUPER_ADMIN | Delete department |

---

## 🔌 Socket.io Events

### Connect with Auth
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'Bearer eyJhbG...' }
});
```

### Events Emitted by Server
| Event | Payload | Description |
|-------|---------|-------------|
| `notification:new` | Notification object | New notification received |
| `attendance:clockIn` | `{ employeeId, inTime, isLate }` | Employee clocked in |
| `attendance:clockOut` | `{ employeeId, outTime, totalHours }` | Employee clocked out |
| `leave:updated` | `{ status, leaveRequestId }` | Leave status changed |
| `user:online` | `{ userId, employeeId }` | User came online |
| `user:offline` | `{ userId, employeeId }` | User went offline |

### Events Emitted by Client
| Event | Payload | Description |
|-------|---------|-------------|
| `join:department` | `departmentId` | Join dept room |
| `attendance:subscribe` | — | Subscribe to live feed (Manager+) |
| `typing:start` | `{ departmentId }` | Typing indicator |
| `typing:stop` | `{ departmentId }` | Stop typing |

---

## 📊 Database Models

| Model | Description |
|-------|-------------|
| `User` | Auth credentials, role, profile |
| `Employee` | Employment data, salary, banking |
| `Department` | Org unit with budget & head |
| `Position` | Job title with salary bands |
| `Attendance` | Daily clock-in/out with in/out times |
| `LeavePolicy` | Leave type rules per company |
| `LeaveBalance` | Per-employee annual leave balance |
| `LeaveRequest` | Leave applications with approval flow |
| `Payroll` | Monthly salary computation |
| `SalaryRevision` | Salary change audit trail |
| `JobPosting` | Open positions with requirements |
| `Application` | Candidate applications |
| `Interview` | Interview scheduling & feedback |
| `Internship` | Intern tracking & evaluation |
| `Notification` | In-app notifications |
| `Announcement` | Company-wide announcements |
| `Document` | Employee document storage |
| `AuditLog` | System audit trail |
| `Holiday` | Public holiday calendar |

---

## 🏗️ Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": { ... },
  "timestamp": "2025-05-26T10:00:00.000Z"
}
```

Paginated responses include:
```json
{
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🔒 Security Features

- **JWT** with short-lived access tokens (15min) + refresh tokens (7 days)
- **bcrypt** password hashing (cost factor 12)
- **Helmet** security headers
- **CORS** whitelisting
- **Rate limiting** — 100 req/15min globally, 10 req/15min on login
- **Role-based access control** on every protected route
- **Input validation** via express-validator

---

## 📜 Scripts

```bash
npm run dev          # Start with nodemon
npm start            # Production start
npm run db:generate  # Generate Prisma client
npm run db:push      # Sync schema to DB (no migrations)
npm run db:migrate   # Run migrations (production)
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
npm run setup        # Full first-time setup
```
