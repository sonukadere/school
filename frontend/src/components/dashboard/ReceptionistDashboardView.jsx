import {
  Users,
  Calendar,
  School,
  UserCheck,
  Plus,
  ArrowRight,
  Clock,
  GraduationCap,
  Bell,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ReceptionistDashboardView({ data, user }) {
  const counts = data?.counts || {}
  const recentStudents = data?.recentStudents || []
  const notices = data?.notices || []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-3xl bg-gradient-to-r from-pink-600 via-rose-700 to-indigo-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            Front Desk & Reception Portal
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Receptionist'}!
          </h1>
          <p className="mt-1 text-rose-100 text-sm max-w-xl">
            Coordinate student admissions, assist visiting parents and staff, and monitor daily campus schedules.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to="/students/add"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-rose-800 shadow-md hover:bg-rose-50 transition"
            >
              <Plus size={16} /> Register Student
            </Link>
            <Link
              to="/students"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-800/60 border border-rose-400/30 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 transition"
            >
              <Users size={16} /> Student Directory
            </Link>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-800/60 border border-rose-400/30 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 transition"
            >
              <Calendar size={16} /> School Calendar
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Enrolled</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-800">{counts.totalStudents || 0}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <GraduationCap size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Active students in school</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Teaching Staff</p>
              <h3 className="mt-1 text-2xl font-bold text-rose-600">{counts.totalTeachers || 0}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Users size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Faculty members</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Non-Teaching Staff</p>
              <h3 className="mt-1 text-2xl font-bold text-amber-600">{counts.totalStaff || 0}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <UserCheck size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Support & administrative staff</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Classes & Sections</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-600">{counts.totalClasses || 0}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <School size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Active class batches</p>
        </div>
      </div>

      {/* Main Grid: Recent Students & Campus Notices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Student Admissions */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Recent Student Admissions</h3>
              <p className="text-xs text-slate-500">Recently registered student profiles</p>
            </div>
            <Link
              to="/students"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student No</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Father Name</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No recent student registrations found.
                    </td>
                  </tr>
                ) : (
                  recentStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{s.studentId}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {s.firstName} {s.lastName || ''}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.class?.name ? `${s.class.name} (${s.class.section})` : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.fatherName || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* School Notices */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-indigo-600" />
              <h3 className="text-base font-bold text-slate-800">Campus Notices</h3>
            </div>
            <Link
              to="/notices"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {notices.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No active notices.</p>
            ) : (
              notices.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100/60 transition"
                >
                  <p className="font-semibold text-xs text-slate-800 line-clamp-1">{n.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{n.content}</p>
                  <span className="mt-2 block text-[10px] text-slate-400">
                    {new Date(n.publishDate).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
