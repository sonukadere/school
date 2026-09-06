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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const todaySchedule = [
    { time: '08:30 AM - 09:15 AM', subject: 'Mathematics', class: 'Class 8-A', room: 'Room 401', status: 'Completed' },
    { time: '09:30 AM - 10:15 AM', subject: 'Advanced Algebra', class: 'Class 9-A', room: 'Room 501', status: 'In Progress' },
    { time: '11:00 AM - 11:45 AM', subject: 'Geometry & Theorems', class: 'Class 10-A', room: 'Room 601', status: 'Upcoming' },
    { time: '01:30 PM - 02:15 PM', subject: 'Problem Solving Lab', class: 'Class 7-A', room: 'Math Lab', status: 'Upcoming' },
  ]

  const assignments = [
    { title: 'Quadratic Equations Exercise 4.2', class: 'Class 10-A', dueDate: 'Tomorrow, 5:00 PM', submissions: '28/32' },
    { title: 'Triangle Congruence Theorems Proofs', class: 'Class 9-A', dueDate: 'Sep 08, 2026', submissions: '19/30' },
    { title: 'Linear Equations in One Variable Worksheet', class: 'Class 8-A', dueDate: 'Sep 10, 2026', submissions: '12/28' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Teacher Profile Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-800 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
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
              Welcome to your faculty dashboard. Access your class rosters, record daily attendance, enter examination grades, and publish assignments.
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
            <p className="text-2xl font-bold text-slate-900">{classes.length || 4}</p>
            <p className="text-[11px] text-violet-600 font-medium mt-0.5">Assigned Batches</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Students Taught</p>
            <p className="text-2xl font-bold text-slate-900">{data?.totalStudents || 120}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Active Enrollment</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today's Lectures</p>
            <p className="text-2xl font-bold text-slate-900">4 Classes</p>
            <p className="text-[11px] text-slate-500 mt-0.5">1 Completed • 1 In Progress</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Marks</p>
            <p className="text-2xl font-bold text-slate-900">1 Exam</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Mid-Term Assessment</p>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Schedule & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable */}
        <Card title="Today's Teaching Schedule" className="lg:col-span-2">
          <div className="space-y-3">
            {todaySchedule.map((slot, index) => (
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
            ))}
          </div>
        </Card>

        {/* Assigned Classes */}
        <Card title="My Allocated Classes">
          <div className="space-y-2.5">
            {classes.slice(0, 5).map((cls) => (
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
            ))}
          </div>
        </Card>
      </div>

      {/* Assignments & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Homework & Assignments */}
        <Card title="Active Assignments & Homework">
          <div className="space-y-3">
            {assignments.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.class} • Due: <span className="font-semibold text-rose-600">{item.dueDate}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                    Submissions: {item.submissions}
                  </span>
                </div>
              </div>
            ))}
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
