import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import SuperAdminDashboardView from '../../components/dashboard/SuperAdminDashboardView'
import SchoolAdminDashboardView from '../../components/dashboard/SchoolAdminDashboardView'
import TeacherDashboardView from '../../components/dashboard/TeacherDashboardView'
import StudentDashboardView from '../../components/dashboard/StudentDashboardView'
import ParentDashboardView from '../../components/dashboard/ParentDashboardView'
import { getDashboardData } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

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
  if (user?.role === 'Super Admin' || user?.isSuperAdmin) {
    return <SuperAdminDashboardView data={data} user={user} />
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

export default Dashboard
