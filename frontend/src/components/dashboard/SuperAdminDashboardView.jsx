import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Users,
  UserCheck,
  GraduationCap,
  Briefcase,
  Database,
  Server,
  Settings,
  Activity,
  HardDrive,
  FileText,
  Key,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function SuperAdminDashboardView({ data, user }) {
  const [systemStats, setSystemStats] = useState({
    dbStatus: 'Connected (Healthy)',
    mongoVersion: 'v7.0.5',
    storageUsed: '42.8 MB',
    uptime: '99.98%',
    activeSessions: 18,
    lastBackup: 'Today, 04:00 AM',
  })

  const today = formatDate(new Date())

  const userDistribution = [
    { role: 'Super Admins', count: 2, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', link: '/settings' },
    { role: 'School Admins', count: 3, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/settings' },
    { role: 'Teachers & Faculty', count: data?.totalTeachers || 12, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/teachers' },
    { role: 'Enrolled Students', count: data?.totalStudents || 48, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', link: '/students' },
    { role: 'Registered Parents', count: 24, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', link: '/students' },
  ]

  const permissionsMatrix = [
    { module: 'User Management & Roles', superAdmin: 'Full Access', schoolAdmin: 'View / Limited', teacher: 'None', student: 'None', parent: 'None' },
    { module: 'Institute & System Settings', superAdmin: 'Full Access', schoolAdmin: 'View Only', teacher: 'None', student: 'None', parent: 'None' },
    { module: 'Database & Backup Control', superAdmin: 'Full Access', schoolAdmin: 'None', teacher: 'None', student: 'None', parent: 'None' },
    { module: 'Student & Teacher Records', superAdmin: 'Full Access', schoolAdmin: 'Full Access', teacher: 'Class View', student: 'Self Only', parent: 'Child Only' },
    { module: 'Fee Management & Collections', superAdmin: 'Full Access', schoolAdmin: 'Full Access', teacher: 'None', student: 'View Fees', parent: 'Pay / View' },
    { module: 'Examination & Marks Entry', superAdmin: 'Full Access', schoolAdmin: 'Full Access', teacher: 'Enter Marks', student: 'View Results', parent: 'View Results' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Super Admin Top Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-xs font-semibold text-purple-200">
              <ShieldCheck size={14} className="text-purple-300" />
              Super Administrator Control Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, {user?.name || 'Chief Administrator'}
            </h1>
            <p className="text-sm text-purple-200 max-w-xl">
              System-wide governance, global role-based access controls, school settings, and database management for Daily Day Academy.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/settings">
              <Button variant="primary" leftIcon={Settings} className="bg-purple-600 hover:bg-purple-500 border-none shadow-md">
                System Settings
              </Button>
            </Link>
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-4 py-2 border border-white/10 text-xs">
              <span className="text-purple-200 block">System Clock</span>
              <span className="font-semibold text-white">{today}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total System Users</p>
            <p className="text-2xl font-bold text-slate-900">
              {(data?.totalStudents || 0) + (data?.totalTeachers || 0) + 29}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Across 5 System Roles</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Database size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Database Health</p>
            <p className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Healthy
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">MongoDB Atlas • {systemStats.storageUsed}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">System Uptime</p>
            <p className="text-2xl font-bold text-slate-900">{systemStats.uptime}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Zero outages reported</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <HardDrive size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">System Backup</p>
            <p className="text-lg font-bold text-slate-900">{systemStats.lastBackup}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated Daily Snapshot</p>
          </div>
        </Card>
      </div>

      {/* User Distribution & System Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Distribution Panel */}
        <Card title="User Accounts by Role" className="lg:col-span-2">
          <p className="text-xs text-slate-500 mb-4">
            Current active authenticated accounts provisioned across institutional domains.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userDistribution.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.role}
                  to={item.link}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                      <Icon size={20} />
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400 group-hover:text-purple-600 transition" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{item.count}</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{item.role}</p>
                </Link>
              )
            })}
          </div>
        </Card>

        {/* System Configuration Overview */}
        <Card title="System Configuration">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Institution:</span>
              <span className="font-semibold text-slate-800">Daily Day Academy</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Academic Session:</span>
              <Badge className="bg-purple-100 text-purple-700">2026-2027</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Authentication:</span>
              <span className="font-mono text-slate-700 font-medium">JWT (HMAC-SHA256)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Token Duration:</span>
              <span className="font-semibold text-slate-800">24 Hours (Active)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500">Password Hashing:</span>
              <span className="font-mono text-slate-700 font-medium">Bcrypt (Salt rounds: 10)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-semibold text-slate-800">Prisma ORM + MongoDB</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Role-Based Permissions & Privileges Matrix */}
      <Card title="Role-Based Access Control (RBAC) Privileges Matrix">
        <p className="text-xs text-slate-500 mb-4">
          Hierarchical privilege enforcement controlling access across academy micro-frontends and API endpoints.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Functional Domain</th>
                <th className="px-4 py-3">Super Admin</th>
                <th className="px-4 py-3">School Admin</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Parent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.module}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      <CheckCircle2 size={12} /> {row.superAdmin}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-indigo-700">{row.schoolAdmin}</td>
                  <td className="px-4 py-3 text-slate-600">{row.teacher}</td>
                  <td className="px-4 py-3 text-slate-500">{row.student}</td>
                  <td className="px-4 py-3 text-slate-500">{row.parent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
