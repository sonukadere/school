import { useState, useMemo } from 'react'
import { Users, UserPlus, ArrowRight, School } from 'lucide-react'
import { Link } from 'react-router-dom'

const GRADIENT_COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-purple-500 to-violet-500',
  'from-rose-500 to-pink-500',
]

function StudentStatistics({ data = [], gradeData = [], totalStudents = null }) {
  const [viewMode, setViewMode] = useState('GRADE') // 'GRADE' (e.g. Class 1: 47) or 'SECTION' (e.g. Class 1-A: 25)

  // Derive grade-level grouping if not directly supplied by backend
  const computedGradeList = useMemo(() => {
    if (Array.isArray(gradeData) && gradeData.length > 0) {
      return gradeData.map((g) => ({
        name: g.name,
        students: g.students ?? g.count ?? 0,
      }))
    }

    if (!Array.isArray(data) || data.length === 0) return []

    const map = new Map()
    for (const item of data) {
      const rawName = item.className || item.name || 'Unassigned'
      const gradeName = rawName.split(' - ')[0].trim()
      const cnt = Number(item.students ?? item.count ?? 0)
      map.set(gradeName, (map.get(gradeName) || 0) + cnt)
    }

    return Array.from(map.entries()).map(([name, students]) => ({
      name,
      students,
    }))
  }, [data, gradeData])

  const sectionList = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.map((d) => ({
      name: d.name || `${d.className || 'Class'} - ${d.section || ''}`.trim(),
      students: Number(d.students ?? d.count ?? 0),
      className: d.className || d.name,
      section: d.section,
    }))
  }, [data])

  const activeList = viewMode === 'GRADE' ? computedGradeList : sectionList

  const totalEnrolled = useMemo(() => {
    if (totalStudents !== null && totalStudents !== undefined) return totalStudents
    return activeList.reduce((sum, item) => sum + item.students, 0)
  }, [totalStudents, activeList])

  const maxStudentCount = useMemo(() => {
    if (activeList.length === 0) return 40
    return Math.max(...activeList.map((i) => i.students), 1)
  }, [activeList])

  return (
    <div className="w-full min-w-0 overflow-hidden space-y-3.5">
      {/* Top Header info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Users size={14} className="text-indigo-600" />
          <span>Class Distribution</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('GRADE')}
              className={`px-2 py-0.5 rounded transition ${
                viewMode === 'GRADE'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Grade-wise
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SECTION')}
              className={`px-2 py-0.5 rounded transition ${
                viewMode === 'SECTION'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sections
            </button>
          </div>

          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
            {totalEnrolled} Students
          </span>
        </div>
      </div>

      {/* Class distribution progress list */}
      {activeList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
          <School size={24} className="mx-auto mb-1 text-slate-300" />
          <p>No class distribution data available</p>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {activeList.slice(0, 6).map((item, index) => {
            const percentage = Math.round((item.students / maxStudentCount) * 100)
            const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length]

            return (
              <Link
                key={item.name}
                to={`/students?class=${encodeURIComponent(item.name.replace(/\s*-\s*[A-Z]$/, ''))}`}
                className="group block rounded-xl p-2 transition-colors hover:bg-slate-50/80 border border-transparent hover:border-slate-200/60"
                title={`Click to view students in ${item.name}`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </span>
                    <ArrowRight size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-indigo-600 transition-all -translate-x-1 group-hover:translate-x-0" />
                  </div>
                  <span className="text-slate-500 font-medium">
                    <strong className="text-slate-900 font-bold text-xs">{item.students}</strong>
                    <span className="text-slate-400 text-[11px] ml-1">
                      {item.students === 1 ? 'student' : 'students'}
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(percentage, item.students > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          to="/classes"
          className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors inline-flex items-center gap-1"
        >
          <span>View all classes</span>
          <ArrowRight size={12} />
        </Link>
        <Link
          to="/students/add"
          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900"
        >
          <UserPlus size={13} />
          <span>Add Student</span>
        </Link>
      </div>
    </div>
  )
}

export default StudentStatistics
