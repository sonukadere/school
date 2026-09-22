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

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Security enforcement: If account has mustChangePassword, only allow access to change password
  if (user?.mustChangePassword) {
    if (location.pathname !== '/change-password' && location.pathname !== '/profile/change-password') {
      return <Navigate to="/change-password" replace />
    }
    return children
  }

  const roleUpper = (user?.role || '').toUpperCase()

  // 1. Accountant Role Guards
  if (roleUpper === 'ACCOUNTANT' || user?.isAccountant) {
    const allowed = ['/dashboard', '/fees', '/payroll', '/reports', '/crm', '/notices', '/profile', '/settings', '/change-password']
    const isAllowed = allowed.some((prefix) => location.pathname === prefix || location.pathname.startsWith(prefix))
    if (!isAllowed) return <ForbiddenRedirect />
  }

  // 2. Receptionist Role Guards
  if (roleUpper === 'RECEPTIONIST' || user?.isReceptionist) {
    const allowed = ['/dashboard', '/crm', '/parents', '/students', '/staff', '/attendance', '/calendar', '/notices', '/profile', '/change-password']
    const isAllowed = allowed.some((prefix) => location.pathname === prefix || location.pathname.startsWith(prefix))
    if (!isAllowed) return <ForbiddenRedirect />
  }

  // 3. Teacher Role Guards
  if (roleUpper === 'TEACHER') {
    const forbiddenPrefixes = [
      '/students/add',
      '/students/edit',
      '/students/promote',
      '/classes/add',
      '/classes/edit',
      '/subjects/add',
      '/teachers',
      '/staff',
      '/attendance/teachers',
      '/fees',
      '/payroll',
      '/notices/create',
      '/settings',
      '/crm',
      '/reports',
    ]
    const isForbidden = forbiddenPrefixes.some((prefix) =>
      location.pathname.startsWith(prefix)
    )
    if (isForbidden) {
      return <ForbiddenRedirect />
    }
  }

  // 4. Student Role Guards
  if (user?.role === 'Student' || user?.isStudent || roleUpper === 'STUDENT') {
    const forbiddenPrefixes = [
      '/students',
      '/teachers',
      '/classes',
      '/subjects/add',
      '/attendance',
      '/settings',
      '/questions',
      '/exams/create',
      '/marks/entry',
      '/notices/create',
      '/payroll',
      '/crm',
      '/staff',
      '/reports',
    ]
    const isForbidden = forbiddenPrefixes.some((prefix) =>
      location.pathname.startsWith(prefix)
    )
    if (isForbidden) {
      return <ForbiddenRedirect />
    }
  }

  // 5. Parent Role Guards
  if (user?.role === 'Parent' || user?.isParent || roleUpper === 'PARENT') {
    const forbiddenPrefixes = [
      '/students',
      '/teachers',
      '/classes',
      '/subjects/add',
      '/attendance',
      '/settings',
      '/questions',
      '/exams/create',
      '/marks/entry',
      '/notices/create',
      '/payroll',
      '/crm',
      '/staff',
      '/reports',
    ]
    const isForbidden = forbiddenPrefixes.some((prefix) =>
      location.pathname.startsWith(prefix)
    )
    if (isForbidden) {
      return <ForbiddenRedirect />
    }
  }

  // 6. Generic Staff Role Guards
  if (roleUpper === 'STAFF' || user?.isStaff) {
    const forbiddenPrefixes = [
      '/students',
      '/teachers',
      '/classes',
      '/subjects',
      '/attendance',
      '/settings',
      '/questions',
      '/exams',
      '/marks',
      '/certificates',
      '/fees',
      '/payroll',
      '/crm',
      '/reports',
    ]
    const isForbidden = forbiddenPrefixes.some((prefix) =>
      location.pathname.startsWith(prefix)
    )
    if (isForbidden) {
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
        <Route path="/attendance/students" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><StudentAttendance /></Suspense>} />
        <Route path="/attendance/teachers" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><TeacherAttendance /></Suspense>} />
        <Route path="/timetable" element={<Suspense fallback={<Loader fullScreen label="Loading timetable..." />}><TimetablePage /></Suspense>} />

        {/* Homework, Assignments, Study Material, Leave & Calendar */}
        <Route path="/homework" element={<Suspense fallback={<Loader fullScreen label="Loading homework..." />}><HomeworkList /></Suspense>} />
        <Route path="/assignments" element={<Suspense fallback={<Loader fullScreen label="Loading assignments..." />}><AssignmentList /></Suspense>} />
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
