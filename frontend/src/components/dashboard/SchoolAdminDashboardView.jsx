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
  CreditCard,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Layers,
} from 'lucide-react'
import StatCard from './StatCard'
import AttendanceChart from './AttendanceChart'
import StudentStatistics from './StudentStatistics'
import RecentActivities from './RecentActivities'
import QuickActions from './QuickActions'
import Card from '../common/Card'
import Button from '../common/Button'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function SchoolAdminDashboardView({ data, user }) {
  const today = formatDate(new Date())
  const widgets = data?.widgets || {}

  const pendingFees = Number(widgets?.pendingFees || 0)
  const feesCollected = Number(data?.feesCollected || widgets?.feesCollected || widgets?.monthlyFeeCollection || 0)
  const totalExpected = Number(widgets?.totalExpectedFees || (feesCollected + pendingFees))
  const collectionRate = totalExpected > 0 ? Math.round((feesCollected / totalExpected) * 100) : 100

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Modern Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-8 text-white shadow-xl">
        {/* Background glow meshes */}
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md border border-white/15">
              <Sparkles size={13} className="text-amber-300" />
              <span>School Administration Center</span>
              <span className="h-1 w-1 rounded-full bg-indigo-300" />
              <span className="text-white/80">Academic Year 2026–2027</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-indigo-200 via-white to-purple-200 bg-clip-text text-transparent">{user?.name || 'System Administrator'}</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Here is your campus operational pulse for <span className="font-semibold text-white">{today}</span>. All core services are running normally.
            </p>
          </div>

          {/* Quick Primary Actions in Banner */}
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/students/add">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                leftIcon={UserPlus}
              >
                New Admission
              </Button>
            </Link>
            <Link to="/attendance/students">
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 border-0 transition-all"
                rightIcon={ArrowRight}
              >
                Mark Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data?.totalStudents ?? 0}
          icon={GraduationCap}
          accent="indigo"
          trend="+4.2%"
          trendLabel="vs last month"
          link="/students"
        />
        <StatCard
          title="Faculty Members"
          value={data?.totalTeachers ?? 0}
          icon={Users}
          accent="emerald"
          trend="+1"
          trendLabel="active this term"
          link="/teachers"
        />
        <StatCard
          title="Classes & Batches"
          value={data?.totalClasses ?? 0}
          icon={School}
          accent="amber"
          link="/classes"
        />
        <StatCard
          title="Academic Subjects"
          value={data?.totalSubjects ?? 0}
          icon={BookOpen}
          accent="violet"
          link="/subjects"
        />
        <StatCard
          title="Today's Attendance"
          value={`${data?.todayAttendance ?? 0}%`}
          icon={CalendarCheck}
          accent="sky"
          trend="+1.8%"
          trendLabel="vs yesterday"
          link="/attendance"
        />
        <StatCard
          title="Fees Collected"
          value={formatCurrency(feesCollected)}
          icon={Wallet}
          accent="emerald"
          trend="+15.4%"
          trendLabel="this quarter"
          link="/fees"
        />
        <StatCard
          title="Upcoming Exams"
          value={data?.upcomingExams ?? 0}
          icon={FileText}
          accent="rose"
          link="/exams"
        />
        
        {/* Fast CTA Card: Fee Collection */}
        <Link
          to="/fees"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="absolute -right-4 -bottom-4 h-28 w-28 rounded-full bg-white/10 blur-xl group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md text-white">
              <CreditCard size={20} />
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
              Quick Action
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-indigo-200">Fee Counter</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold">Collect Payment</span>
              <ArrowRight size={18} className="transform transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      {/* Analytics & Graphs Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2 self-start"
          title="School Attendance Overview"
          subtitle="Real-time daily roll tracking across all grades"
          icon={CalendarCheck}
          actions={
            <Link
              to="/attendance"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
            >
              Detailed Report &rarr;
            </Link>
          }
        >
          <AttendanceChart data={data?.attendanceChart || []} />
        </Card>

        <Card
          title="Student Demographics"
          subtitle="Enrolled counts by grade & class"
          icon={Layers}
          className="self-start"
        >
          <StudentStatistics
            data={data?.studentStats || []}
            gradeData={data?.gradeStats || []}
            totalStudents={data?.totalStudents}
          />
        </Card>
      </div>

      {/* Operations & Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Quick Management Launcher"
          subtitle="Frequent administrative workflows & shortcuts"
          icon={Sparkles}
        >
          <QuickActions />
        </Card>

        <Card
          title="Recent Campus Activity"
          subtitle="Live announcements, admissions, and logs"
          icon={Calendar}
          actions={
            <Link
              to="/notices"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All &rarr;
            </Link>
          }
        >
          <RecentActivities activities={data?.activities || data?.recentActivities || []} />
        </Card>
      </div>
    </div>
  )
}
