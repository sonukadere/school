import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { getDashboardData } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const SuperAdminDashboardView = lazy(() => import('../../components/dashboard/SuperAdminDashboardView'))
const SchoolAdminDashboardView = lazy(() => import('../../components/dashboard/SchoolAdminDashboardView'))
const TeacherDashboardView = lazy(() => import('../../components/dashboard/TeacherDashboardView'))
const StudentDashboardView = lazy(() => import('../../components/dashboard/StudentDashboardView'))
const ParentDashboardView = lazy(() => import('../../components/dashboard/ParentDashboardView'))
const AccountantDashboardView = lazy(() => import('../../components/dashboard/AccountantDashboardView'))
const ReceptionistDashboardView = lazy(() => import('../../components/dashboard/ReceptionistDashboardView'))

function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(() => {
    setLoading(true)
    setError(null)
    getDashboardData()
      .then((result) => {
        setData(result)
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load dashboard data')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Real-time dynamic sync: auto-update dashboard stats whenever a payment is recorded
  useEffect(() => {
    const handlePayment = () => {
      fetchDashboard()
    }
    window.addEventListener('sms:payment-recorded', handlePayment)
    return () => {
      window.removeEventListener('sms:payment-recorded', handlePayment)
    }
  }, [fetchDashboard])

  if (loading) return <Loader fullScreen label="Loading dashboard..." />

  if (error && !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Unable to load dashboard</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">{error}</p>
        <Button
          variant="primary"
          size="sm"
          className="mt-4 inline-flex items-center gap-2"
          onClick={fetchDashboard}
        >
          <RefreshCw size={16} />
          Retry
        </Button>
      </div>
    )
  }

  // Role-Based Access Control (RBAC): Render distinct customized dashboard view per role
  const renderDashboardView = () => {
    if (user?.role === 'Super Admin' || user?.isSuperAdmin) {
      return <SuperAdminDashboardView data={data} user={user} />
    }

    if (user?.role === 'Accountant' || user?.isAccountant || user?.rawRole === 'ACCOUNTANT') {
      return <AccountantDashboardView data={data} user={user} />
    }

    if (user?.role === 'Receptionist' || user?.isReceptionist || user?.rawRole === 'RECEPTIONIST') {
      return <ReceptionistDashboardView data={data} user={user} />
    }

    if (user?.role === 'Teacher' || user?.isTeacher) {
      return <TeacherDashboardView data={data} user={user} />
    }

    if (user?.role === 'Student' || user?.isStudent) {
      return <StudentDashboardView data={data} user={user} />
    }

    if (user?.role === 'Parent' || user?.isParent) {
      return <ParentDashboardView data={data} user={user} />
    }

    // Default: School Admin
    return <SchoolAdminDashboardView data={data} user={user} />
  }

  return (
    <Suspense fallback={<Loader label="Loading view..." />}>
      {renderDashboardView()}
    </Suspense>
  )
}

export default Dashboard

