import { Link } from 'react-router-dom'
import { GraduationCap, Users, FilePlus2, CalendarCheck, Wallet, Megaphone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ACTIONS = [
  { label: 'Add Student', description: 'Register a new student', to: '/students/add', icon: GraduationCap, classes: 'bg-indigo-600 hover:bg-indigo-700' },
  { label: 'Add Teacher', description: 'Hire a new teacher', to: '/teachers/add', icon: Users, classes: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'Create Exam', description: 'Schedule a new exam', to: '/exams/create', icon: FilePlus2, classes: 'bg-violet-600 hover:bg-violet-700' },
  { label: 'Mark Attendance', description: 'Record today\'s attendance', to: '/attendance/students', icon: CalendarCheck, classes: 'bg-amber-600 hover:bg-amber-700' },
  { label: 'Collect Fees', description: 'Record fee payments', to: '/fees', icon: Wallet, classes: 'bg-rose-600 hover:bg-rose-700' },
  { label: 'Post Notice', description: 'Publish a new notice', to: '/notices/create', icon: Megaphone, classes: 'bg-sky-600 hover:bg-sky-700' },
]

function QuickActions() {
  const { user } = useAuth()

  const filteredActions = ACTIONS.filter((action) => {
    if (user?.role === 'Teacher') {
      const forbidden = ['/teachers/add', '/fees']
      return !forbidden.includes(action.to)
    }
    return true
  })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {filteredActions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.label}
            to={action.to}
            className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110 ${action.classes}`}
            >
              <Icon size={20} />
            </span>
            <span className="text-sm font-semibold text-slate-800">{action.label}</span>
            <span className="hidden text-xs text-slate-500 sm:block">{action.description}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default QuickActions
