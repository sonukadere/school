import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Award,
  Wallet,
  BookOpen,
  Phone,
  Mail,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Avatar from '../common/Avatar'
import { api } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function ParentDashboardView({ data, user }) {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [fees, setFees] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      api.getStudents().catch(() => []),
      api.getFees().catch(() => []),
      api.getNotices().catch(() => []),
    ]).then(([allStudents, allFees, allNotices]) => {
      if (mounted) {
        // Find children linked to parent if available, or fallback to demo enrolled children
        const parentId = user?.parentId || user?.parentNumber || user?.parent?.id
        let children = (allStudents || []).filter((s) => s.parentId === parentId || s.fatherName === user?.name)
        if (!children.length) {
          children = (allStudents || []).slice(0, 2)
        }
        setStudents(children)
        if (children.length > 0) {
          setSelectedStudent(children[0])
        }
        setFees(allFees || [])
        setNotices((allNotices || []).slice(0, 4))
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [user])

  const childFees = fees.filter((f) => f.studentId === selectedStudent?.id)
  const totalFee = childFees.reduce((sum, f) => sum + (f.totalFee || 0), 0)
  const paidFee = childFees.reduce((sum, f) => sum + (f.paidFee || 0), 0)
  const dueFee = Math.max(totalFee - paidFee, 0)
  const feeStatus = dueFee === 0 && totalFee > 0 ? 'Paid' : paidFee > 0 ? 'Partial' : 'Pending'

  const sampleResults = [
    { subject: 'Mathematics', marks: '94/100', grade: 'A+', remarks: 'Excellent logical aptitude' },
    { subject: 'Science', marks: '88/100', grade: 'A', remarks: 'Good grasp of practicals' },
    { subject: 'English', marks: '91/100', grade: 'A+', remarks: 'Outstanding comprehension' },
    { subject: 'Social Studies', marks: '85/100', grade: 'A', remarks: 'Consistent performance' },
  ]

  const childHomework = [
    { subject: 'Mathematics', task: 'Complete Chapter 4 Review Exercises', due: 'Tomorrow, 5 PM', status: 'Submitted' },
    { subject: 'Science', task: 'Physics Lab Report: Reflection of Light', due: 'Friday, 10 AM', status: 'Pending' },
    { subject: 'English', task: 'Read Chapters 5-7 of the class novel', due: 'Monday', status: 'Submitted' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Parent Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-700 via-orange-700 to-indigo-900 p-4 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-amber-200 border border-white/10">
              <Users size={14} className="text-amber-300" />
              Parent &amp; Guardian Portal • ID: {user?.parentNumber || user?.parentId || 'PAR-001'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, {user?.name || 'Guardian'}!
            </h1>
            <p className="text-sm text-amber-100 max-w-xl">
              Monitor your child's academic progress, daily attendance rate, fee balances, homework assignments, and teacher communications.
            </p>
          </div>

          {/* Child Selector Tabs */}
          {students.length > 1 && (
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
              <p className="text-[11px] text-amber-200 uppercase font-semibold mb-1.5 px-2">Select Child:</p>
              <div className="flex gap-2">
                {students.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedStudent(child)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedStudent?.id === child.id
                        ? 'bg-white text-indigo-900 shadow-md'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <User size={14} />
                    {child.fullName || child.firstName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Child Identity Card */}
      {selectedStudent && (
        <Card className="p-4 sm:p-6 border-l-4 border-l-amber-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={selectedStudent.fullName || selectedStudent.name} size="lg" className="rounded-2xl shadow-sm" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{selectedStudent.fullName || selectedStudent.name}</h2>
                  <Badge className="bg-amber-100 text-amber-800">
                    {selectedStudent.className || 'Class 10'} - {selectedStudent.section || 'A'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Student ID: <strong className="text-indigo-600">{selectedStudent.studentId}</strong> • Roll No: {selectedStudent.rollNumber || '14'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/students/${selectedStudent.id}`}>
                <Button variant="outline" size="sm" rightIcon={ExternalLink}>
                  View Full Profile
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Child Attendance</p>
            <p className="text-2xl font-bold text-slate-900">95.4%</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Present today</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Academic Grade</p>
            <p className="text-2xl font-bold text-slate-900">A (89.5%)</p>
            <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Class Rank: #3</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Fee Due Balance</p>
            <p className="text-2xl font-bold text-rose-600">{formatCurrency(dueFee)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Paid: {formatCurrency(paidFee)}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-violet-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Subjects</p>
            <p className="text-2xl font-bold text-slate-900">6 Subjects</p>
            <p className="text-[11px] text-slate-500 mt-0.5">CBSE Curriculum</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Exam Results & Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Examination Results */}
        <Card title="Latest Examination Results">
          <div className="space-y-3">
            {sampleResults.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.subject}</p>
                  <p className="text-xs text-slate-500">{item.remarks}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{item.marks}</span>
                  <Badge className="ml-2 bg-emerald-100 text-emerald-700">{item.grade}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Assignments & Homework */}
        <Card title="Homework & Assignments">
          <div className="space-y-3">
            {childHomework.map((hw, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{hw.subject}</p>
                  <p className="text-sm font-semibold text-slate-800">{hw.task}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {hw.due}</p>
                </div>
                <Badge className={hw.status === 'Submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {hw.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fee Status & Teacher Contact Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Payment Status */}
        <Card title="Fee Status & Online Payment" className="lg:col-span-2">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div>
                <span className="text-xs text-slate-400 block">Total Tuition Fee</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(totalFee)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Paid Amount</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(paidFee)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Current Balance Due</span>
                <span className="text-lg font-bold text-rose-600">{formatCurrency(dueFee)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Payment status:{' '}
                <strong className={dueFee === 0 && totalFee > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {dueFee === 0 && totalFee > 0 ? 'All Dues Cleared' : feeStatus === 'Partial' ? 'Partially Paid' : 'Pending Payment'}
                </strong>
              </span>
              <Link to="/fees">
                <Button size="sm" variant="primary">
                  View Fee Ledger & Receipts
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Teacher Communication */}
        <Card title="Class Teacher Contact">
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <Avatar name="Sunita Sharma" size="md" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Mrs. Sunita Sharma</p>
                <p className="text-slate-500">Class 10-A In-Charge</p>
              </div>
            </div>
            <div className="space-y-2 pt-1 text-slate-600">
              <p className="flex items-center gap-2">
                <Mail size={15} className="text-indigo-600" />
                <span>sunita.sharma@school.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={15} className="text-indigo-600" />
                <span>+91 98765 43210</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock size={15} className="text-indigo-600" />
                <span>Office Hours: 02:00 PM - 03:30 PM</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* School Notices */}
      <Card title="School Notices & Announcements">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <div key={n.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                <span className="text-[10px] text-slate-400">{n.date ? formatDate(n.date) : 'Recent'}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{n.content}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
