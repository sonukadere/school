import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  School,
  BookOpen,
  CalendarCheck,
  Wallet,
  FileText,
  ArrowRight,
} from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import AttendanceChart from '../../components/dashboard/AttendanceChart'
import StudentStatistics from '../../components/dashboard/StudentStatistics'
import RecentActivities from '../../components/dashboard/RecentActivities'
import QuickActions from '../../components/dashboard/QuickActions'
import Card from '../../components/common/Card'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { getDashboardData } from '../../services/api'
import { formatCurrency } from '../../utils/helpers'
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{today}</p>
        </div>
        {user?.role !== 'Student' && (
          <Link to="/attendance/students">
            <Button variant="primary" rightIcon={ArrowRight}>
              Mark Attendance
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {user?.role !== 'Student' && (
          <StatCard title="Total Students" value={data.totalStudents} icon={GraduationCap} accent="indigo" trend="+3.2%" trendLabel="this month" link="/students" />
        )}
        {user?.role !== 'Teacher' && user?.role !== 'Student' && (
          <StatCard title="Total Teachers" value={data.totalTeachers} icon={Users} accent="emerald" trend="+1" trendLabel="this month" link="/teachers" />
        )}
        <StatCard title="Total Classes" value={data.totalClasses} icon={School} accent="amber" link="/classes" />
        <StatCard title="Total Subjects" value={data.totalSubjects} icon={BookOpen} accent="violet" link="/subjects" />
        <StatCard title="Today's Attendance" value={`${data.todayAttendance}%`} icon={CalendarCheck} accent="sky" trend="+2.1%" trendLabel="vs yesterday" link="/attendance" />
        {user?.role !== 'Teacher' && user?.role !== 'Student' && (
          <StatCard title="Fees Collected" value={formatCurrency(data.feesCollected)} icon={Wallet} accent="emerald" trend="+12.5%" trendLabel="this term" link="/fees" />
        )}
        <StatCard title="Upcoming Exams" value={data.upcomingExams} icon={FileText} accent="rose" link="/exams" />
        {user?.role !== 'Student' && (
          <Link
            to="/attendance/students"
            className="group flex flex-col justify-between rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <CalendarCheck size={28} className="text-indigo-200" />
            <div>
              <p className="text-sm font-medium text-indigo-200">Attendance</p>
              <p className="text-lg font-bold">Mark Now</p>
            </div>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 self-start">
          <AttendanceChart data={data.attendanceChart} />
        </Card>
        <Card title="Recent Activities" subtitle="Latest updates across the school">
          <RecentActivities activities={data.activities} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          title="Student Statistics"
          subtitle="Student distribution by class"
          className="xl:col-span-2 self-start"
        >
          <StudentStatistics data={data.studentStats} />
        </Card>
        <Card title="Quick Actions" subtitle="Frequently used operations">
          <QuickActions />
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
