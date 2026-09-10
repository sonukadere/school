import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Clock,
  Bell,
  Users,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { api } from '../../services/api'
import { formatDate } from '../../utils/helpers'

export default function TeacherDashboardView({ data, user }) {
  const [classes, setClasses] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      api.getClasses().catch(() => []),
      api.getNotices().catch(() => []),
    ]).then(([classList, noticeList]) => {
      if (mounted) {
        setClasses(classList || [])
        setNotices((noticeList || []).slice(0, 4))
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const today = formatDate(new Date())

  const todayTimetableRaw = data?.data?.todayTimetable || data?.todayTimetable || data?.widgets?.timetable || []
  const todaySchedule = Array.isArray(todayTimetableRaw)
    ? todayTimetableRaw.map((entry) => ({
        time: entry.startTime && entry.endTime ? `${entry.startTime} - ${entry.endTime}` : (entry.time || 'Period'),
        subject: entry.subject?.name || entry.subject || 'Academic Session',
        class: entry.class ? `${entry.class.name || ''} ${entry.class.section || ''}`.trim() : (entry.className || 'Class'),
        room: entry.roomNumber || entry.class?.roomNumber || 'Classroom',
        status: entry.status || 'Upcoming',
      }))
    : []

  const upcomingExams = data?.data?.exams || []
  const pendingMarksCount = data?.widgets?.pendingMarksEntry ?? (data?.data?.pendingMarks?.length ?? 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Teacher Profile Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-800 via-indigo-800 to-purple-900 p-4 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-violet-200 border border-white/10">
              <GraduationCap size={14} className="text-violet-300" />
              Faculty Portal • Teacher ID: {user?.teacherNumber || user?.teacherId || 'TCH-001'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Hello, {user?.name || 'Professor'}!
            </h1>
            <p className="text-sm text-violet-200 max-w-xl">
              Welcome to your faculty dashboard. Access your class rosters, record daily attendance, enter examination grades, and review notices.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/attendance/students">
              <Button variant="primary" leftIcon={CalendarCheck} className="bg-white text-indigo-900 hover:bg-slate-100 font-semibold border-none shadow-md">
                Mark Attendance
              </Button>
            </Link>
            <Link to="/marks/entry">
              <Button variant="outline" leftIcon={ClipboardList} className="text-white border-white/30 hover:bg-white/10">
                Enter Marks
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-violet-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">My Classes</p>
            <p className="text-2xl font-bold text-slate-900">{classes.length || (data?.widgets?.myClasses ?? 0)}</p>
            <p className="text-[11px] text-violet-600 font-medium mt-0.5">Assigned Batches</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Students Taught</p>
            <p className="text-2xl font-bold text-slate-900">{data?.widgets?.myStudents ?? data?.totalStudents ?? 0}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Active Enrollment</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today's Lectures</p>
            <p className="text-2xl font-bold text-slate-900">{todaySchedule.length} Period{todaySchedule.length === 1 ? '' : 's'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Scheduled for {today}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Marks</p>
            <p className="text-2xl font-bold text-slate-900">{pendingMarksCount} Assessment{pendingMarksCount === 1 ? '' : 's'}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Requires Grade Entry</p>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Schedule & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable */}
        <Card title="Today's Teaching Schedule" className="lg:col-span-2">
          <div className="space-y-3">
            {todaySchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <Clock className="h-10 w-10 text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No Teaching Periods Today</p>
                <p className="text-xs text-slate-500 mt-1">There are no scheduled lecture periods assigned for your timetable today.</p>
              </div>
            ) : (
              todaySchedule.map((slot, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{slot.subject}</p>
                      <p className="text-xs text-slate-500">
                        {slot.class} • <span className="font-semibold text-slate-700">{slot.room}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-medium text-slate-600">{slot.time}</span>
                    <Badge
                      className={
                        slot.status === 'Completed'
                          ? 'bg-slate-200 text-slate-700'
                          : slot.status === 'In Progress'
                          ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                          : 'bg-indigo-100 text-indigo-700'
                      }
                    >
                      {slot.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Assigned Classes */}
        <Card title="My Allocated Classes">
          <div className="space-y-2.5">
            {classes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No assigned classes found</p>
            ) : (
              classes.slice(0, 5).map((cls) => (
                <div
                  key={cls.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{cls.name} - {cls.section || 'A'}</p>
                    <p className="text-slate-500">Room: {cls.roomNumber || 'TBD'}</p>
                  </div>
                  <Link to="/attendance/students">
                    <Button size="xs" variant="outline" className="text-violet-600 border-violet-200 hover:bg-violet-50">
                      Attendance
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Assignments & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exams & Assessments */}
        <Card title="Upcoming Exams & Assessments">
          <div className="space-y-3">
            {upcomingExams.length > 0 ? (
              upcomingExams.slice(0, 5).map((exam) => (
                <div key={exam.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{exam.name || exam.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {exam.class?.name || 'Class Exam'} • Date: <span className="font-semibold text-indigo-600">{exam.startDate ? formatDate(exam.startDate) : 'Scheduled'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/marks/entry">
                      <Button size="xs" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                        Enter Marks
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">All Assessments Up to Date</p>
                <p className="text-xs text-slate-500 mt-1">No upcoming examinations or pending grade submissions require attention.</p>
              </div>
            )}
          </div>
        </Card>

        {/* School Announcements */}
        <Card title="Faculty Announcements & Notices">
          <div className="space-y-3">
            {notices.length > 0 ? (
              notices.map((n) => (
                <div key={n.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.date || 'Recent'}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.content}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No current announcements</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
