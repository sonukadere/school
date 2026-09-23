import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Loader from '../components/common/Loader'
import PageNotFound from '../components/common/PageNotFound'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Login from '../pages/Auth/Login'
import ForgotPassword from '../pages/Auth/ForgotPassword'

/**
 * Safe lazy loader with auto-retry on dynamic chunk fetch failure (common during redeployments)
 */
function lazyRetry(componentImport, key = '') {
  return lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem(`sms_retry_${key}`);
    try {
      return await componentImport();
    } catch (error) {
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem(`sms_retry_${key}`, 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(`sms_retry_${key}`);
      throw error;
    }
  });
}

const RegisterStudent = lazyRetry(() => import('../pages/Auth/RegisterStudent'), 'reg_student')
const Dashboard = lazyRetry(() => import('../pages/Dashboard/Dashboard'), 'dashboard')
const StudentList = lazyRetry(() => import('../pages/Students/StudentList'), 'student_list')
const AddStudent = lazyRetry(() => import('../pages/Students/AddStudent'), 'add_student')
const EditStudent = lazyRetry(() => import('../pages/Students/EditStudent'), 'edit_student')
const StudentDetails = lazyRetry(() => import('../pages/Students/StudentDetails'), 'student_details')
const TeacherList = lazyRetry(() => import('../pages/Teachers/TeacherList'), 'teacher_list')
const AddTeacher = lazyRetry(() => import('../pages/Teachers/AddTeacher'), 'add_teacher')
const EditTeacher = lazyRetry(() => import('../pages/Teachers/EditTeacher'), 'edit_teacher')
const TeacherDetails = lazyRetry(() => import('../pages/Teachers/TeacherDetails'), 'teacher_details')
const ClassList = lazyRetry(() => import('../pages/Classes/ClassList'), 'class_list')
const AddClass = lazyRetry(() => import('../pages/Classes/AddClass'), 'add_class')
const EditClass = lazyRetry(() => import('../pages/Classes/EditClass'), 'edit_class')
const SubjectList = lazyRetry(() => import('../pages/Subjects/SubjectList'), 'subject_list')
const AddSubject = lazyRetry(() => import('../pages/Subjects/AddSubject'), 'add_subject')
const Attendance = lazyRetry(() => import('../pages/Attendance/Attendance'), 'attendance')
const StudentAttendance = lazyRetry(() => import('../pages/Attendance/StudentAttendance'), 'student_attendance')
const TeacherAttendance = lazyRetry(() => import('../pages/Attendance/TeacherAttendance'), 'teacher_attendance')
const MyAttendance = lazyRetry(() => import('../pages/Attendance/MyAttendance'), 'my_attendance')
const FeeList = lazyRetry(() => import('../pages/Fees/FeeList'), 'fee_list')
const ExamList = lazyRetry(() => import('../pages/Exams/ExamList'), 'exam_list')
const CreateExam = lazyRetry(() => import('../pages/Exams/CreateExam'), 'create_exam')
const Marks = lazyRetry(() => import('../pages/Marks/Marks'), 'marks')
const MarksEntry = lazyRetry(() => import('../pages/Marks/MarksEntry'), 'marks_entry')
const ResultView = lazyRetry(() => import('../pages/Marks/ResultView'), 'result_view')
const GenerateMarksheet = lazyRetry(() => import('../pages/Marks/GenerateMarksheet'), 'generate_marksheet')
const TransferCertificateList = lazyRetry(() => import('../pages/Certificates/TransferCertificateList'), 'tc_list')
const NoticeList = lazyRetry(() => import('../pages/Notices/NoticeList'), 'notice_list')
const CreateNotice = lazyRetry(() => import('../pages/Notices/CreateNotice'), 'create_notice')
const ProfilePage = lazyRetry(() => import('../pages/Profile/ProfilePage'), 'profile')
const EditProfile = lazyRetry(() => import('../pages/Profile/EditProfile'), 'edit_profile')
const ChangePassword = lazyRetry(() => import('../pages/Profile/ChangePassword'), 'change_password')
const SettingsPage = lazyRetry(() => import('../pages/Settings/SettingsPage'), 'settings')
const NotificationList = lazyRetry(() => import('../pages/Notifications/NotificationList'), 'notifications')
const QuestionBankList = lazyRetry(() => import('../pages/Questions/QuestionBankList'), 'question_bank')
const ExamPaperView = lazyRetry(() => import('../pages/Exams/ExamPaperView'), 'exam_paper')
const DigitalExamAttempt = lazyRetry(() => import('../pages/Exams/DigitalExamAttempt'), 'digital_exam')
const PayrollPage = lazyRetry(() => import('../pages/Payroll/PayrollPage'), 'payroll')
const TimetablePage = lazyRetry(() => import('../pages/Timetable/TimetablePage'), 'timetable')
const HomeworkList = lazyRetry(() => import('../pages/Homework/HomeworkList'), 'homework_list')
const AssignmentList = lazyRetry(() => import('../pages/Assignments/AssignmentList'), 'assignment_list')
const StudyMaterialList = lazyRetry(() => import('../pages/StudyMaterial/StudyMaterialList'), 'study_material_list')
const LeaveManagementPage = lazyRetry(() => import('../pages/Leave/LeaveManagementPage'), 'leave_page')
const StudentPromotionPage = lazyRetry(() => import('../pages/Students/StudentPromotionPage'), 'promotion_page')
const ParentList = lazyRetry(() => import('../pages/Parents/ParentList'), 'parent_list')
const StaffList = lazyRetry(() => import('../pages/Staff/StaffList'), 'staff_list')
const SchoolCalendarPage = lazyRetry(() => import('../pages/Calendar/SchoolCalendarPage'), 'calendar_page')
const ReportsPage = lazyRetry(() => import('../pages/Reports/ReportsPage'), 'reports_page')

function ForbiddenRedirect() {
  const { showToast } = useToast()

  useEffect(() => {
    showToast('Access Denied: You do not have permission to view this page.', 'error')
  }, [showToast])

  return <Navigate to="/dashboard" replace />
}

export const ROUTE_PERMISSIONS = [
  // Dashboard & Profile
  { prefix: '/dashboard', permission: 'dashboard.view' },
  { prefix: '/profile', permission: 'profile.view' },
  { prefix: '/change-password', permission: 'profile.update' },

  // Students & Promotion
  { path: '/students/add', permission: 'students.create' },
  { path: '/students/promote', permission: 'promotion.manage' },
  { prefix: '/students/edit/', permission: 'students.update' },
  { prefix: '/students/', permission: 'students.view', excludeRoles: ['STUDENT'] },
  { path: '/students', permission: 'students.view', excludeRoles: ['STUDENT'] },

  // Teachers
  { path: '/teachers/add', permission: 'teachers.create' },
  { prefix: '/teachers/edit/', permission: 'teachers.update' },
  { prefix: '/teachers', permission: 'teachers.view' },

  // Staff & Parents
  { prefix: '/staff', permission: 'staff.view' },
  { prefix: '/parents', permission: 'parents.view' },

  // Classes & Subjects
  { path: '/classes/add', permission: 'classes.create' },
  { prefix: '/classes/edit/', permission: 'classes.update' },
  { prefix: '/classes', permission: 'classes.view' },

  { path: '/subjects/add', permission: 'subjects.create' },
  { prefix: '/subjects/edit/', permission: 'subjects.update' },
  { prefix: '/subjects', permission: 'subjects.view' },

  // Attendance
  { path: '/attendance/teachers', permission: 'teacherAttendance.view' },
  { path: '/attendance/students', permission: 'attendance.mark', excludeRoles: ['STUDENT'] },
  { path: '/attendance/my', permission: 'attendance.view' },
  { prefix: '/attendance', permission: 'attendance.view' },

  // Academics
  { prefix: '/timetable', permission: 'timetables.view' },
  { prefix: '/study-material', permission: 'documents.view' },
  { prefix: '/leave', permission: 'leave.view' },
  { prefix: '/calendar', permission: 'events.view' },

  // Exams, Questions & Marks
  { path: '/exams/create', permission: 'exams.create' },
  { prefix: '/exams', permission: 'exams.view' },
  { prefix: '/questions', permission: 'questions.view' },
  { path: '/marks/entry', permission: 'marks.create' },
  { path: '/marks/generate', permission: 'marksheets.generate' },
  { prefix: '/marks', anyPermissions: ['marks.view', 'results.view'] },

  // Certificates
  { prefix: '/certificates', permission: 'tc.view' },

  // Fees & Payroll
  { prefix: '/fees', permission: 'fees.view' },
  { prefix: '/payroll', permission: 'payroll.view' },

  // Reports
  { prefix: '/reports', permission: 'reports.view' },

  // Notices
  { path: '/notices/create', permission: 'notices.manage' },
  { prefix: '/notices', permission: 'notices.view' },

  // Settings & CRM
  { prefix: '/settings', permission: 'settings.manage' },
  { prefix: '/crm', permission: 'crm.view' },
]

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, hasPermission, hasAnyPermission } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Security enforcement: If account has mustChangePassword, only allow access to change password
  if (user?.mustChangePassword) {
    if (location.pathname !== '/change-password' && location.pathname !== '/profile/change-password') {
      return <Navigate to="/change-password" replace />
    }
    return children
  }

  // Super Admin bypasses path permissions
  if (user?.isSuperAdmin || user?.role === 'SUPER_ADMIN' || user?.role === 'Super Admin') {
    return children
  }

  const roleUpper = (user?.role || '').toUpperCase().replace(/\s+/g, '_')
  const path = location.pathname

  // Find most specific route rule (exact path first, then longest matching prefix)
  const exactRule = ROUTE_PERMISSIONS.find((r) => r.path && r.path === path)
  const prefixRules = ROUTE_PERMISSIONS.filter((r) => r.prefix && (path === r.prefix || path.startsWith(r.prefix)))
  const matchedRule = exactRule || (prefixRules.length > 0 ? prefixRules.sort((a, b) => b.prefix.length - a.prefix.length)[0] : null)

  if (matchedRule) {
    // Check role exclusion
    if (matchedRule.excludeRoles && (matchedRule.excludeRoles.includes(roleUpper) || (user?.isStudent && matchedRule.excludeRoles.includes('STUDENT')))) {
      return <ForbiddenRedirect />
    }

    // Check specific permission
    if (matchedRule.permission && !hasPermission(matchedRule.permission)) {
      return <ForbiddenRedirect />
    }

    // Check anyPermissions
    if (matchedRule.anyPermissions && matchedRule.anyPermissions.length > 0 && !hasAnyPermission(matchedRule.anyPermissions)) {
      return <ForbiddenRedirect />
    }
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/register"
        element={
          <Suspense fallback={<Loader fullScreen label="Loading registration..." />}>
            <RegisterStudent />
          </Suspense>
        }
      />
      <Route
        path="/student-register"
        element={
          <Suspense fallback={<Loader fullScreen label="Loading registration..." />}>
            <RegisterStudent />
          </Suspense>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="*"
          element={
            <Suspense fallback={<Loader fullScreen label="Loading page..." />}>
              <PageNotFound />
            </Suspense>
          }
        />
        <Route
          path="/"
          element={
            <Suspense fallback={<Loader fullScreen label="Loading page..." />}>
              <Navigate to="/dashboard" replace />
            </Suspense>
          }
        />
        <Route path="/dashboard" element={<Suspense fallback={<Loader fullScreen label="Loading dashboard..." />}><Dashboard /></Suspense>} />
        <Route path="/parents" element={<Suspense fallback={<Loader fullScreen label="Loading parents directory..." />}><ParentList /></Suspense>} />

        {/* Student Management & Promotion */}
        <Route path="/students" element={<Suspense fallback={<Loader fullScreen label="Loading students..." />}><StudentList /></Suspense>} />
        <Route path="/students/add" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><AddStudent /></Suspense>} />
        <Route path="/students/promote" element={<Suspense fallback={<Loader fullScreen label="Loading promotion console..." />}><StudentPromotionPage /></Suspense>} />
        <Route path="/students/edit/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><EditStudent /></Suspense>} />
        <Route path="/students/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><StudentDetails /></Suspense>} />

        {/* Teachers & Non-Teaching Staff */}
        <Route path="/teachers" element={<Suspense fallback={<Loader fullScreen label="Loading teachers..." />}><TeacherList /></Suspense>} />
        <Route path="/teachers/add" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><AddTeacher /></Suspense>} />
        <Route path="/teachers/edit/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><EditTeacher /></Suspense>} />
        <Route path="/teachers/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><TeacherDetails /></Suspense>} />
        <Route path="/staff" element={<Suspense fallback={<Loader fullScreen label="Loading staff directory..." />}><StaffList /></Suspense>} />

        {/* Classes & Subjects */}
        <Route path="/classes" element={<Suspense fallback={<Loader fullScreen label="Loading classes..." />}><ClassList /></Suspense>} />
        <Route path="/classes/add" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><AddClass /></Suspense>} />
        <Route path="/classes/edit/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><EditClass /></Suspense>} />

        <Route path="/subjects" element={<Suspense fallback={<Loader fullScreen label="Loading subjects..." />}><SubjectList /></Suspense>} />
        <Route path="/subjects/add" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><AddSubject /></Suspense>} />

        {/* Attendance & Timetable */}
        <Route path="/attendance" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><Attendance /></Suspense>} />
        <Route path="/attendance/my" element={<Suspense fallback={<Loader fullScreen label="Loading my attendance..." />}><MyAttendance /></Suspense>} />
        <Route path="/attendance/students" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><StudentAttendance /></Suspense>} />
        <Route path="/attendance/teachers" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><TeacherAttendance /></Suspense>} />
        <Route path="/timetable" element={<Suspense fallback={<Loader fullScreen label="Loading timetable..." />}><TimetablePage /></Suspense>} />

        {/* Homework & Assignments (Removed features - redirect to dashboard) */}
        <Route path="/homework" element={<Navigate to="/dashboard" replace />} />
        <Route path="/assignments" element={<Navigate to="/dashboard" replace />} />

        {/* Study Material, Leave & Calendar */}
        <Route path="/study-material" element={<Suspense fallback={<Loader fullScreen label="Loading study materials..." />}><StudyMaterialList /></Suspense>} />
        <Route path="/leave" element={<Suspense fallback={<Loader fullScreen label="Loading leave requests..." />}><LeaveManagementPage /></Suspense>} />
        <Route path="/calendar" element={<Suspense fallback={<Loader fullScreen label="Loading calendar..." />}><SchoolCalendarPage /></Suspense>} />

        {/* Financials & Reports */}
        <Route path="/fees" element={<Suspense fallback={<Loader fullScreen label="Loading fees..." />}><FeeList /></Suspense>} />
        <Route path="/payroll" element={<Suspense fallback={<Loader fullScreen label="Loading payroll..." />}><PayrollPage /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<Loader fullScreen label="Loading reports..." />}><ReportsPage /></Suspense>} />

        {/* Exams, Questions & Marks */}
        <Route path="/exams" element={<Suspense fallback={<Loader fullScreen label="Loading exams..." />}><ExamList /></Suspense>} />
        <Route path="/exams/create" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><CreateExam /></Suspense>} />
        <Route path="/exams/:id/paper" element={<Suspense fallback={<Loader fullScreen label="Loading exam paper..." />}><ExamPaperView /></Suspense>} />
        <Route path="/exams/:id/attempt" element={<Suspense fallback={<Loader fullScreen label="Loading digital exam..." />}><DigitalExamAttempt /></Suspense>} />
        <Route path="/questions" element={<Suspense fallback={<Loader fullScreen label="Loading question bank..." />}><QuestionBankList /></Suspense>} />

        <Route path="/marks" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><Marks /></Suspense>} />
        <Route path="/marks/entry" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><MarksEntry /></Suspense>} />
        <Route path="/marks/results" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><ResultView /></Suspense>} />
        <Route path="/marks/generate" element={<Suspense fallback={<Loader fullScreen label="Loading marksheet generator..." />}><GenerateMarksheet /></Suspense>} />
        <Route path="/marksheets" element={<Suspense fallback={<Loader fullScreen label="Loading marksheet generator..." />}><GenerateMarksheet /></Suspense>} />
        <Route path="/certificates" element={<Suspense fallback={<Loader fullScreen label="Loading certificates..." />}><TransferCertificateList /></Suspense>} />

        {/* Notices & Profile */}
        <Route path="/notices" element={<Suspense fallback={<Loader fullScreen label="Loading notices..." />}><NoticeList /></Suspense>} />
        <Route path="/notices/create" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><CreateNotice /></Suspense>} />

        <Route path="/profile" element={<Suspense fallback={<Loader fullScreen label="Loading profile..." />}><ProfilePage /></Suspense>} />
        <Route path="/profile/edit" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><EditProfile /></Suspense>} />
        <Route path="/profile/change-password" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><ChangePassword /></Suspense>} />
        <Route path="/change-password" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><ChangePassword /></Suspense>} />

        <Route path="/settings" element={<Suspense fallback={<Loader fullScreen label="Loading settings..." />}><SettingsPage /></Suspense>} />
        <Route path="/notifications" element={<Suspense fallback={<Loader fullScreen label="Loading notifications..." />}><NotificationList /></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
