import { Link } from 'react-router-dom'
import { ClipboardList, ArrowRight, PenLine, Table2, Award, Sparkles } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'

const OPTIONS = [
  {
    title: 'Generate Marksheet (मार्कशीट जनरेट)',
    description: 'Generate, preview and print official student report cards & statements of marks for individual students or entire class batches.',
    to: '/marks/generate',
    icon: Award,
    color: 'bg-amber-50 text-amber-600',
    highlight: true,
  },
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
        title="Marks & Report Cards"
        description="Enter marks, review results, and generate official student marksheets"
        breadcrumb={[{ label: 'Marks' }]}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {filteredOptions.map((option) => {
          const Icon = option.icon
          return (
            <Link
              key={option.title}
              to={option.to}
              className={`group relative rounded-3xl border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${
                option.highlight
                  ? 'border-amber-200/90 ring-1 ring-amber-400/20 hover:border-amber-300'
                  : 'border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${option.color} shadow-inner`}>
                    <Icon size={24} />
                  </span>
                  <div className="flex items-center gap-1">
                    {option.highlight && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase tracking-wider">
                        <Sparkles size={11} /> Official
                      </span>
                    )}
                    <ArrowRight size={20} className="text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-indigo-500" />
                  </div>
                </div>
                <h2 className="mt-4 text-base font-extrabold text-slate-900">{option.title}</h2>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{option.description}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${option.highlight ? 'text-amber-700' : 'text-indigo-600'}`}>
                  <ClipboardList size={14} /> Open Module <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Marks
