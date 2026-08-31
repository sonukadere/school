import { Link } from 'react-router-dom'
import { ClipboardList, ArrowRight, PenLine, Table2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'

const OPTIONS = [
  {
    title: 'Marks Entry',
    description: 'Enter marks for students against a selected exam and subject, with automatic total, percentage and grade calculation.',
    to: '/marks/entry',
    icon: PenLine,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    title: 'Result View',
    description: 'Review results for any exam with aggregate totals, percentages, grades and class performance summaries.',
    to: '/marks/results',
    icon: Table2,
    color: 'bg-emerald-50 text-emerald-600',
  },
]

function Marks() {
  const { user } = useAuth()
  const filteredOptions = OPTIONS.filter((option) => {
    if (user?.role === 'Student') {
      return option.to !== '/marks/entry'
    }
    return true
  })

  return (
    <div>
      <PageHeader
        title="Marks"
        description="Enter and review student examination results"
        breadcrumb={[{ label: 'Marks' }]}
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
                <ClipboardList size={16} /> Get Started
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Marks
