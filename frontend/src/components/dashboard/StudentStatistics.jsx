import { Users, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

const DEFAULT_CLASSES = [
  { name: 'Class 10 A', students: 38, capacity: 40, color: 'from-indigo-500 to-indigo-600' },
  { name: 'Class 9 B', students: 35, capacity: 40, color: 'from-blue-500 to-cyan-500' },
  { name: 'Class 8 A', students: 32, capacity: 35, color: 'from-emerald-500 to-teal-500' },
  { name: 'Class 7 C', students: 28, capacity: 35, color: 'from-amber-500 to-orange-500' },
  { name: 'Class 6 A', students: 30, capacity: 35, color: 'from-purple-500 to-violet-500' },
]

function StudentStatistics({ data = [] }) {
  const hasRealData = Array.isArray(data) && data.length > 0 && data.some((d) => (d.students || d.count || 0) > 0)
  
  const classList = hasRealData
    ? data.map((d, index) => {
        const colors = [
          'from-indigo-500 to-indigo-600',
          'from-blue-500 to-cyan-500',
          'from-emerald-500 to-teal-500',
          'from-amber-500 to-orange-500',
          'from-purple-500 to-violet-500',
        ]
        const students = d.students || d.count || 0
        const capacity = Math.max(students + 5, 40)
        return {
          name: d.name || `Class ${index + 1}`,
          students,
          capacity,
          color: colors[index % colors.length],
        }
      })
    : DEFAULT_CLASSES

  const totalEnrolled = classList.reduce((sum, item) => sum + item.students, 0)

  return (
    <div className="w-full space-y-4">
      {/* Top Header info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Users size={14} className="text-indigo-600" />
          <span>Class Distribution</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
          {totalEnrolled} Students
        </span>
      </div>

      {/* Class distribution progress list */}
      <div className="space-y-3 pt-1">
        {classList.slice(0, 5).map((item) => {
          const percentage = Math.min(100, Math.round((item.students / item.capacity) * 100))
          return (
            <div key={item.name} className="group rounded-xl p-2 transition-colors hover:bg-slate-50/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="text-slate-500 font-medium">
                  <strong className="text-slate-900 font-bold">{item.students}</strong>
                  <span className="text-slate-400">/{item.capacity}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">({percentage}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          to="/students"
          className="font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          View all classes
        </Link>
        <Link
          to="/students/add"
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <UserPlus size={13} />
          Add Student
        </Link>
      </div>
    </div>
  )
}

export default StudentStatistics
