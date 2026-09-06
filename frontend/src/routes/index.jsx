import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Loader from '../components/common/Loader'
import PageNotFound from '../components/common/PageNotFound'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Login from '../pages/Auth/Login'
import ForgotPassword from '../pages/Auth/ForgotPassword'

const RegisterStudent = lazy(() => import('../pages/Auth/RegisterStudent'))
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'))
const StudentList = lazy(() => import('../pages/Students/StudentList'))
const AddStudent = lazy(() => import('../pages/Students/AddStudent'))
const EditStudent = lazy(() => import('../pages/Students/EditStudent'))
const StudentDetails = lazy(() => import('../pages/Students/StudentDetails'))
const TeacherList = lazy(() => import('../pages/Teachers/TeacherList'))
const AddTeacher = lazy(() => import('../pages/Teachers/AddTeacher'))
const EditTeacher = lazy(() => import('../pages/Teachers/EditTeacher'))
const TeacherDetails = lazy(() => import('../pages/Teachers/TeacherDetails'))
const ClassList = lazy(() => import('../pages/Classes/ClassList'))
const AddClass = lazy(() => import('../pages/Classes/AddClass'))
const EditClass = lazy(() => import('../pages/Classes/EditClass'))
const SubjectList = lazy(() => import('../pages/Subjects/SubjectList'))
const AddSubject = lazy(() => import('../pages/Subjects/AddSubject'))
const Attendance = lazy(() => import('../pages/Attendance/Attendance'))
const StudentAttendance = lazy(() => import('../pages/Attendance/StudentAttendance'))
const TeacherAttendance = lazy(() => import('../pages/Attendance/TeacherAttendance'))
const FeeList = lazy(() => import('../pages/Fees/FeeList'))
const ExamList = lazy(() => import('../pages/Exams/ExamList'))
const CreateExam = lazy(() => import('../pages/Exams/CreateExam'))
const Marks = lazy(() => import('../pages/Marks/Marks'))
const MarksEntry = lazy(() => import('../pages/Marks/MarksEntry'))
const ResultView = lazy(() => import('../pages/Marks/ResultView'))
const TransferCertificateList = lazy(() => import('../pages/Certificates/TransferCertificateList'))
const NoticeList = lazy(() => import('../pages/Notices/NoticeList'))
const CreateNotice = lazy(() => import('../pages/Notices/CreateNotice'))
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage'))
const EditProfile = lazy(() => import('../pages/Profile/EditProfile'))
const ChangePassword = lazy(() => import('../pages/Profile/ChangePassword'))
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'))
const NotificationList = lazy(() => import('../pages/Notifications/NotificationList'))

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

  if (user?.role === 'Teacher') {
    const forbiddenPrefixes = [
      '/teachers',
      '/attendance/teachers',
      '/fees',
      '/settings',
    ]
    const isForbidden = forbiddenPrefixes.some((prefix) =>
      location.pathname.startsWith(prefix)
    )
    if (isForbidden) {
      return <ForbiddenRedirect />
    }
  }

  if (user?.role === 'Student' || user?.isStudent) {
    const forbiddenPrefixes = [
      '/students',
      '/teachers',
      '/classes',
      '/subjects',
      '/attendance',
      '/settings',
      '/exams/create',
      '/marks/entry',
      '/notices/create',
    ]
    const isForbidden = forbiddenPrefixes.some((prefix) =>
      location.pathname.startsWith(prefix)
    )
    if (isForbidden) {
      return <ForbiddenRedirect />
    }
  }

  if (user?.role === 'Parent' || user?.isParent) {
    const forbiddenPrefixes = [
      '/students',
      '/teachers',
      '/classes',
      '/subjects',
      '/attendance',
      '/settings',
      '/exams/create',
      '/marks/entry',
      '/notices/create',
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

        <Route path="/students" element={<Suspense fallback={<Loader fullScreen label="Loading students..." />}><StudentList /></Suspense>} />
        <Route path="/students/add" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><AddStudent /></Suspense>} />
        <Route path="/students/edit/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><EditStudent /></Suspense>} />
        <Route path="/students/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><StudentDetails /></Suspense>} />

        <Route path="/teachers" element={<Suspense fallback={<Loader fullScreen label="Loading teachers..." />}><TeacherList /></Suspense>} />
        <Route path="/teachers/add" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><AddTeacher /></Suspense>} />
        <Route path="/teachers/edit/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><EditTeacher /></Suspense>} />
        <Route path="/teachers/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><TeacherDetails /></Suspense>} />

        <Route path="/classes" element={<Suspense fallback={<Loader fullScreen label="Loading classes..." />}><ClassList /></Suspense>} />
        <Route path="/classes/add" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><AddClass /></Suspense>} />
        <Route path="/classes/edit/:id" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><EditClass /></Suspense>} />

        <Route path="/subjects" element={<Suspense fallback={<Loader fullScreen label="Loading subjects..." />}><SubjectList /></Suspense>} />
        <Route path="/subjects/add" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><AddSubject /></Suspense>} />

        <Route path="/attendance" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><Attendance /></Suspense>} />
        <Route path="/attendance/students" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><StudentAttendance /></Suspense>} />
        <Route path="/attendance/teachers" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><TeacherAttendance /></Suspense>} />

        <Route path="/fees" element={<Suspense fallback={<Loader fullScreen label="Loading fees..." />}><FeeList /></Suspense>} />

        <Route path="/exams" element={<Suspense fallback={<Loader fullScreen label="Loading exams..." />}><ExamList /></Suspense>} />
        <Route path="/exams/create" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><CreateExam /></Suspense>} />

        <Route path="/marks" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><Marks /></Suspense>} />
        <Route path="/marks/entry" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><MarksEntry /></Suspense>} />
        <Route path="/marks/results" element={<Suspense fallback={<Loader fullScreen label="Loading page..." />}><ResultView /></Suspense>} />
        <Route path="/certificates" element={<Suspense fallback={<Loader fullScreen label="Loading certificates..." />}><TransferCertificateList /></Suspense>} />

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
