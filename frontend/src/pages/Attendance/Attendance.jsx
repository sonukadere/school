import { Link } from 'react-router-dom'
import { CalendarCheck, Users, ArrowRight, ClipboardList } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'

const OPTIONS = [
  {
    title: 'Student Attendance',
    description: 'Mark daily attendance for students by class and section with Present, Absent and Leave statuses.',
    to: '/attendance/students',
    icon: ClipboardList,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    title: 'Teacher Attendance',
    description: 'Record teacher attendance for the selected date with quick status updates.',
    to: '/attendance/teachers',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600',
  },
]

function Attendance() {
  const { user } = useAuth()
  const filteredOptions = OPTIONS.filter((option) => {
    if (user?.role === 'Teacher') {
      return option.to !== '/attendance/teachers'
    }
    return true
  })

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark and manage student and teacher attendance"
        breadcrumb={[{ label: 'Attendance' }]}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredOptions.map((option) => {
          const Icon = option.icon
          return (
            <Link
              key={option.title}
              to={option.to}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${option.color}`}>
                  <Icon size={24} />
                </span>
                <ArrowRight size={20} className="text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-indigo-500" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{option.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{option.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                <CalendarCheck size={16} /> Get Started
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Attendance
