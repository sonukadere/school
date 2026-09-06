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
  TrendingUp,
  UserPlus,
  PlusCircle,
  CreditCard,
} from 'lucide-react'
import StatCard from './StatCard'
import AttendanceChart from './AttendanceChart'
import StudentStatistics from './StudentStatistics'
import RecentActivities from './RecentActivities'
import QuickActions from './QuickActions'
import Card from '../common/Card'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/helpers'

export default function SchoolAdminDashboardView({ data, user }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 mb-1">
            🏫 School Administration Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-slate-500">{today} • Academic Year 2026-2027</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/students/add">
            <Button variant="outline" leftIcon={UserPlus} size="sm">
              New Admission
            </Button>
          </Link>
          <Link to="/attendance/students">
            <Button variant="primary" rightIcon={ArrowRight} size="sm">
              Mark Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Total Students"
          value={data?.totalStudents || 0}
          icon={GraduationCap}
          accent="indigo"
          trend="+4.2%"
          trendLabel="vs last month"
          link="/students"
        />
        <StatCard
          title="Faculty Members"
          value={data?.totalTeachers || 0}
          icon={Users}
          accent="emerald"
          trend="+1"
          trendLabel="active this term"
          link="/teachers"
        />
        <StatCard
          title="Classes & Batches"
          value={data?.totalClasses || 0}
          icon={School}
          accent="amber"
          link="/classes"
        />
        <StatCard
          title="Academic Subjects"
          value={data?.totalSubjects || 0}
          icon={BookOpen}
          accent="violet"
          link="/subjects"
        />
        <StatCard
          title="Today's Attendance"
          value={`${data?.todayAttendance || 0}%`}
          icon={CalendarCheck}
          accent="sky"
          trend="+1.8%"
          trendLabel="vs yesterday"
          link="/attendance"
        />
        <StatCard
          title="Fees Collected"
          value={formatCurrency(data?.feesCollected || 0)}
          icon={Wallet}
          accent="emerald"
          trend="+15.4%"
          trendLabel="this quarter"
          link="/fees"
        />
        <StatCard
          title="Upcoming Exams"
          value={data?.upcomingExams || 0}
          icon={FileText}
          accent="rose"
          link="/exams"
        />
        <Link
          to="/fees"
          className="group flex flex-col justify-between rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <CreditCard size={28} className="text-indigo-200" />
          <div>
            <p className="text-xs font-medium text-indigo-200">Fee Accounts</p>
            <p className="text-base font-bold">Collect Payment &rarr;</p>
          </div>
        </Link>
      </div>

      {/* Analytics & Graphs */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 self-start" title="School Attendance Overview">
          <AttendanceChart />
        </Card>
        <Card title="Student Demographics" className="self-start">
          <StudentStatistics />
        </Card>
      </div>

      {/* Operations & Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActions />
        <RecentActivities activities={data?.activities || data?.recentActivities || []} />
      </div>
    </div>
  )
}
