import { Link } from 'react-router-dom'
import {
  GraduationCap,
  CalendarCheck,
  BookOpen,
  FileText,
  Wallet,
  Clock,
  Bell,
  ArrowRight,
  Award,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function StudentDashboardView({ data, user }) {
  const summary = data?.studentSummary || data?.widgets || data || {}
  const profile = summary.profile || data?.widgets?.profile || {}
  const attendancePct = summary.attendancePercentage ?? data?.widgets?.attendancePercentage ?? data?.todayAttendance ?? 0
  const subjects = summary.subjects || data?.widgets?.subjects || []
  const timetable = summary.timetable || data?.widgets?.timetable || []
  const upcomingExams = summary.upcomingExams || data?.widgets?.upcomingExams || []
  const results = summary.results || data?.widgets?.results || []
  const feeStatus = summary.feeStatus || data?.widgets?.feeStatus
  const notices = summary.notices || data?.widgets?.notices || []

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const todayTimetable = timetable.filter((slot) => slot.day === todayName)
  const activeTimetable = todayTimetable.length > 0 ? todayTimetable : timetable.slice(0, 6)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Welcome & Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-4 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col min-[480px]:flex-row items-center min-[480px]:items-start gap-4 sm:gap-5 text-center min-[480px]:text-left">
            <div className="flex h-14 w-14 sm:h-18 sm:w-18 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-inner shrink-0 text-2xl sm:text-3xl font-extrabold">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-md border border-white/20">
                  Student Portal
                </span>
                <span className="rounded-full bg-emerald-400/20 text-emerald-200 px-3 py-0.5 text-xs font-semibold border border-emerald-400/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Enrollment
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome, {user?.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-indigo-100">
                <span>
                  <strong>Student ID:</strong>{' '}
                  <span className="font-mono font-bold text-white bg-black/20 px-2 py-0.5 rounded">
                    {user?.studentNumber || profile.studentId || user?.studentId || 'Enrolled'}
                  </span>
                </span>
                {profile.className && (
                  <span>
                    <strong>Class:</strong> {profile.className} - {profile.section || 'A'}
                  </span>
                )}
                {profile.rollNumber && (
                  <span>
                    <strong>Roll No:</strong> {profile.rollNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <Link to="/marks/results">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20 border-white/30 w-full justify-center"
                leftIcon={Award}
              >
                View My Results
              </Button>
            </Link>
            <Link to="/profile">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white hover:bg-white/20 border-white/30 w-full justify-center"
                leftIcon={UserCheck}
              >
                My Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Student Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Attendance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Attendance</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <CalendarCheck size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{attendancePct}%</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Session</span>
            <span className={attendancePct >= 75 ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
              {attendancePct >= 75 ? 'Satisfactory' : 'Needs Improvement'}
            </span>
          </div>
        </div>

        {/* Subjects */}
        <Link
          to="/subjects"
          className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-violet-300 hover:shadow-md block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-violet-600 transition">
              Enrolled Subjects
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:scale-110 transition">
              <BookOpen size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{subjects.length}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Class Curriculum</span>
            <span className="text-violet-600 font-semibold flex items-center gap-0.5 group-hover:underline">
              View All <ArrowRight size={12} />
            </span>
          </div>
        </Link>

        {/* Upcoming Exams */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Exams</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FileText size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{upcomingExams.length}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span>Scheduled Tests & Finals</span>
          </div>
        </div>

        {/* Fee Status */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fee Status</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {feeStatus ? (feeStatus.dueAmount === 0 ? 'Fully Paid' : formatCurrency(feeStatus.dueAmount)) : 'Cleared'}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{feeStatus?.dueAmount > 0 ? 'Pending Amount' : 'All Dues Cleared'}</span>
            <span className={`font-semibold ${feeStatus?.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {feeStatus?.status || 'PAID'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Schedule & Timetable */}
        <Card
          title="My Timetable & Schedule"
          subtitle={`${todayName}'s Classes`}
          className="lg:col-span-2"
        >
          {activeTimetable.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {activeTimetable.map((slot, idx) => (
                <div
                  key={slot.id || idx}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:bg-white hover:border-indigo-100 hover:shadow-xs"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 shrink-0 font-bold text-xs">
                    {slot.subject?.code?.slice(0, 3) || `P${idx + 1}`}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {slot.subject?.name || slot.subjectName || 'Class'}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={12} className="text-slate-400" />
                      {slot.startTime || '09:00 AM'} - {slot.endTime || '09:45 AM'}
                    </p>
                    {slot.teacher?.name && (
                      <p className="text-[11px] text-indigo-600 font-medium mt-1">
                        Teacher: {slot.teacher.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Clock size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No classes scheduled for today.</p>
              <p className="text-xs text-slate-400 mt-1">Enjoy your study time or weekend!</p>
            </div>
          )}
        </Card>

        {/* Notices & Announcements */}
        <Card
          title="Notice Board"
          subtitle="School announcements & alerts"
          actions={
            <Link to="/notices" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          }
        >
          {notices.length > 0 ? (
            <div className="space-y-3">
              {notices.slice(0, 4).map((notice) => (
                <div
                  key={notice.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs space-y-1 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate pr-2">
                      {notice.title}
                    </span>
                    <Badge className="bg-indigo-50 text-indigo-600 text-[10px] py-0 shrink-0">
                      {formatDate(notice.publishDate)}
                    </Badge>
                  </div>
                  <p className="text-slate-600 line-clamp-2">{notice.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Bell size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs">No active notices for students.</p>
            </div>
          )}
        </Card>
      </div>

      {/* My Enrolled Subjects Section */}
      <Card
        title="My Enrolled Subjects"
        subtitle="Curriculum subjects & assigned teachers for your class"
        actions={
          <Link
            to="/subjects"
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            View Subject Details <ArrowRight size={13} />
          </Link>
        }
      >
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((sub, idx) => (
              <div
                key={sub.id || idx}
                className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-white hover:border-violet-200 hover:shadow-xs"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 shrink-0 font-bold">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {sub.name}
                    </p>
                    {sub.code && (
                      <span className="font-mono text-[11px] font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-100 shrink-0">
                        {sub.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                    <span className="text-slate-400">Teacher:</span>
                    <span className="font-medium text-slate-700">
                      {sub.teacher?.name || sub.assignedTeacher || 'Faculty Assigned'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No subjects enrolled yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Your class curriculum will appear here once assigned by the school.
            </p>
          </div>
        )}
      </Card>

      {/* Results Snapshot & Quick Services */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Results Card */}
        <Card
          title="Recent Results"
          subtitle="Latest examination performance"
          className="lg:col-span-2"
          actions={
            <Link to="/marks/results" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Complete Marksheet <ArrowRight size={13} />
            </Link>
          }
        >
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.slice(0, 2).map((res) => (
                <div key={res.examId} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{res.examName}</h4>
                      <p className="text-[11px] text-slate-500">Date: {formatDate(res.examDate || res.startDate)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Marks:</span>
                      <span className="font-bold text-indigo-600 text-base">{res.total}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {res.subjects?.slice(0, 4).map((sub, i) => (
                      <div key={i} className="rounded-lg bg-white p-2 border border-slate-100 text-center">
                        <p className="text-[11px] text-slate-500 truncate">{sub.subject}</p>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{sub.marks}</p>
                        {sub.grade && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                            {sub.grade}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Award size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Exam results will be published here.</p>
              <p className="text-xs text-slate-400 mt-1">Check back once your examination papers are evaluated.</p>
            </div>
          )}
        </Card>

        {/* Quick Portal Services */}
        <Card title="Student Services" subtitle="Self-service operations">
          <div className="space-y-2">
            <Link
              to="/marks/results"
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Award size={16} />
                </div>
                <span>View My Report Card</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>

            <Link
              to="/certificates"
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-700"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <FileText size={16} />
                </div>
                <span>Transfer Certificate (TC)</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>

            <Link
              to="/profile"
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UserCheck size={16} />
                </div>
                <span>Update Student Profile</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>

            <Link
              to="/profile/change-password"
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs font-semibold text-slate-700 transition hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-700"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Sparkles size={16} />
                </div>
                <span>Change Portal Password</span>
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
