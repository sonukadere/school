import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  FilePlus2,
  CalendarCheck,
  Wallet,
  Megaphone,
  ClipboardList,
  Bell,
  UserCircle,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ACTIONS = [
  {
    label: 'Add Student',
    description: 'Admit new student',
    to: '/students/add',
    icon: GraduationCap,
    gradient: 'from-indigo-500 to-indigo-600',
    bgLight: 'bg-indigo-50/60 hover:bg-indigo-50',
    borderColor: 'border-indigo-100 hover:border-indigo-200',
    textColor: 'text-indigo-600',
  },
  {
    label: 'Add Teacher',
    description: 'Onboard faculty',
    to: '/teachers/add',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50/60 hover:bg-emerald-50',
    borderColor: 'border-emerald-100 hover:border-emerald-200',
    textColor: 'text-emerald-600',
  },
  {
    label: 'Create Exam',
    description: 'Schedule tests',
    to: '/exams/create',
    icon: FilePlus2,
    gradient: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50/60 hover:bg-violet-50',
    borderColor: 'border-violet-100 hover:border-violet-200',
    textColor: 'text-violet-600',
  },
  {
    label: 'Mark Attendance',
    description: 'Record daily rolls',
    to: '/attendance/students',
    icon: CalendarCheck,
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50/60 hover:bg-amber-50',
    borderColor: 'border-amber-100 hover:border-amber-200',
    textColor: 'text-amber-600',
  },
  {
    label: 'Collect Fees',
    description: 'Record payments',
    to: '/fees',
    icon: Wallet,
    gradient: 'from-rose-500 to-pink-600',
    bgLight: 'bg-rose-50/60 hover:bg-rose-50',
    borderColor: 'border-rose-100 hover:border-rose-200',
    textColor: 'text-rose-600',
  },
  {
    label: 'Post Notice',
    description: 'Circular & updates',
    to: '/notices/create',
    icon: Megaphone,
    gradient: 'from-sky-500 to-blue-600',
    bgLight: 'bg-sky-50/60 hover:bg-sky-50',
    borderColor: 'border-sky-100 hover:border-sky-200',
    textColor: 'text-sky-600',
  },
]

const STUDENT_ACTIONS = [
  {
    label: 'View Results',
    description: 'Check your exam marks',
    to: '/marks/results',
    icon: ClipboardList,
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50/60 hover:bg-emerald-50',
    borderColor: 'border-emerald-100 hover:border-emerald-200',
    textColor: 'text-emerald-600',
  },
  {
    label: 'View Notices',
    description: 'Read school announcements',
    to: '/notices',
    icon: Bell,
    gradient: 'from-sky-500 to-blue-600',
    bgLight: 'bg-sky-50/60 hover:bg-sky-50',
    borderColor: 'border-sky-100 hover:border-sky-200',
    textColor: 'text-sky-600',
  },
  {
    label: 'My Profile',
    description: 'View your student info',
    to: '/profile',
    icon: UserCircle,
    gradient: 'from-indigo-500 to-indigo-600',
    bgLight: 'bg-indigo-50/60 hover:bg-indigo-50',
    borderColor: 'border-indigo-100 hover:border-indigo-200',
    textColor: 'text-indigo-600',
  },
]

function QuickActions() {
  const { user } = useAuth()

  const filteredActions =
    user?.role === 'Student'
      ? STUDENT_ACTIONS
      : ACTIONS.filter((action) => {
          if (user?.role === 'Teacher') {
            const forbidden = ['/students/add', '/classes/add', '/teachers/add', '/fees']
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
            className={`group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border ${action.borderColor} ${action.bgLight} p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span className="block text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-950 transition-colors">
                {action.label}
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block mt-0.5">
                {action.description}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default QuickActions
