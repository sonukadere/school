import { useEffect, useState } from 'react'
import Loader from '../../components/common/Loader'
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

  useEffect(() => {
    let mounted = true
    getDashboardData().then((result) => {
      if (mounted) setData(result)
    })
    return () => {
      mounted = false
    }
  }, [])

  if (!data) return <Loader fullScreen label="Loading dashboard..." />

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
