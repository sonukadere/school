# School Management System

A centralized, full-stack web-based platform designed to manage the complete day-to-day operations of a single school with role-based dashboards, secure backend APIs, and real database data as the single source of truth.

---

## System Overview

The **School Management System** provides tailored dashboards and fine-grained permissions for **Super Admin, Admin, Teacher, and Student**, ensuring that every user only accesses features relevant to their role.

- **Architecture**: Single-School, Role-Based Full-Stack ERP
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Chart.js
- **Backend**: Node.js, Express, Prisma ORM / MongoDB, JWT Authentication
- **Data Source**: Real database data as the single source of truth across all modules

---

## Role-Based Access

| Role | Core Capabilities |
| :--- | :--- |
| **Super Admin** | System-level configuration, administrative user management, institution settings, and overarching school data oversight. |
| **Admin** | Student admissions, teacher management, class/section/subject mappings, exam scheduling, fee collection, payroll, receipt generation, and administrative reports. |
| **Teacher** | Assigned class & section tracking, daily attendance marking, marks entry for assigned subjects, student directory access, homework/assignments management, and timetable viewing. |
| **Student** | Personal academic profile, class attendance records, weekly timetable, assigned homework/study materials, online exam attempts, marks/results, and fee payment history with downloadable receipts. |

---

## Main Modules

### 1. Dashboard
- Tailored dashboards per role (Super Admin, School Admin, Teacher, Student, Parent, Accountant, Receptionist).
- Real-time KPI metrics: student & teacher enrollment counts, daily attendance rate, fee collection totals, upcoming exams, and recent notices.

### 2. Student Management
- Complete student admission workflow with auto-generated registration numbers.
- Detailed student profiles (personal details, parent/guardian info, academic records, contact info).
- Class & section assignments, student search, filtering, and bulk promotion console.

### 3. Teacher & Staff Management
- Teaching and non-teaching staff directories with contact, qualification, and joining details.
- Class teacher assignments and subject specializations.
- Teacher attendance tracking and leave management.

### 4. Class & Subject Management
- Academic grade levels, sections, and room assignments.
- Core and elective subjects mapped to specific classes and qualified teachers.

### 5. Attendance Management
- Daily student attendance marking (Present, Absent, Late, Half-day, Excused).
- Historical attendance records, monthly calendar views, and summary percentage reports.
- Separate staff and teacher attendance logs.

### 6. Exam & Marks Management
- Exam schedules, term exams, and question banks.
- Subject-wise marks entry with automated total, percentage, and grade calculation.
- Marksheet generator with customizable grading scales and print/export formats.

### 7. Fee Management & Payments
- Dynamic fee structures categorized by class and academic session.
- Student fee assignment, partial payments, discounts, and overdue/late fee calculations.
- Multi-channel payment recording: Cash, UPI, Card, Bank Transfer, Cheque, QR code, and integrated **Razorpay** online payment gateway.
- Auto-generated fee receipts with printable layout and transaction IDs.

### 8. Teacher Salary & Payroll
- Salary structures with basic pay, allowances (HRA, DA, conveyance), and deductions (PF, tax).
- Monthly payroll generation, payment status tracking, and downloadable payslips.

### 9. Certificates & Documentation
- Official Transfer Certificates (TC) and character certificates.
- Certificate numbering, audit logging, and print-ready PDF-styled generation.

### 10. Timetable & Academic Management
- Interactive timetable manager by class, section, day, and period.
- Homework and assignment distribution with due dates and submission tracking.
- Digital study materials repository with downloadable files and reference links.

### 11. Notifications & Communication
- Automated email/SMTP notifications for welcome alerts, fee receipts, and password resets.
- Notice board for school-wide or role-targeted announcements.
- Optional WhatsApp Click-to-Chat shortcuts for parent and student communications.

### 12. Reports & Analytics
- Comprehensive administrative reports covering admissions, fee collections, outstanding dues, attendance analytics, exam performances, and payroll expenses.

---

## Core Principles & Security

- **Single Source of Truth**: All data operations (students, teachers, fees, attendance, payroll) are dynamically persisted in the database via authenticated REST APIs. No hardcoded or mock data.
- **Role-Based Authorization**: Robust backend middleware verifies JWT authentication and enforces role permissions on every API endpoint.
- **Data Integrity & Auditability**: Transactions, payment records, and fee allocations maintain relational consistency and complete audit trails.

---

## Getting Started

### Backend Setup
```bash
cd backend
npm install
# Configure your environment variables in .env (PORT, DATABASE_URL, JWT_SECRET, SMTP)
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
