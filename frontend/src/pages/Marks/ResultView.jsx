import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, ClipboardCheck, Table2, GraduationCap } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import EmptyState from '../../components/common/EmptyState'
import MarksheetModal from '../../components/marksheets/MarksheetModal'
import { api } from '../../services/api'
import { gradeFromPercentage, percentage } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

function ResultView() {
  const { user } = useAuth()
  const isParent = Boolean(user?.role === 'Parent' || user?.isParent)
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState([])
  const [examId, setExamId] = useState('')
  const [loading, setLoading] = useState(true)
  const [marksheetModalOpen, setMarksheetModalOpen] = useState(false)
  const [selectedStudentForMarksheet, setSelectedStudentForMarksheet] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([api.getExams(), api.getStudents(), api.getMarks()])
      .then(([examData, studentData, markData]) => {
        if (mounted) {
          setExams(Array.isArray(examData) ? examData : [])
          setStudents(Array.isArray(studentData) ? studentData : [])
          setMarks(Array.isArray(markData) ? markData : [])
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('[ResultView] Error loading data:', err)
        if (mounted) {
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  const selectedExam = exams.find((exam) => exam.id === examId)

  const results = useMemo(() => {
    if (!selectedExam) return []
    return students
      .filter((student) =>
        (selectedExam.classId && student.classId === selectedExam.classId) ||
        student.className === selectedExam.className ||
        `${student.className} ${student.section}`.trim() === selectedExam.className,
      )
      .map((student) => {
        const studentMarks = marks.filter((mark) => mark.examId === examId && mark.studentId === student.id)
        if (!studentMarks.length) return null
        const total = studentMarks.reduce((sum, mark) => sum + mark.marks, 0)
        const maxTotal = studentMarks.reduce((sum, mark) => sum + (mark.maxMarks || 100), 0)
        const percent = percentage(total, maxTotal)
        const grade = gradeFromPercentage(percent)
        return {
          student,
          total,
          maxTotal,
          percent,
          grade: grade.grade,
          color: grade.color,
          marks: studentMarks,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.percent - a.percent)
  }, [selectedExam, students, marks, examId])

  const summary = useMemo(() => {
    if (!results.length) return null
    const average = results.reduce((sum, r) => sum + r.percent, 0) / results.length
    const highest = results[0]
    const lowest = results[results.length - 1]
    return { average: Math.round(average), highest, lowest, total: results.length }
  }, [results])

  if (loading) {
    return (
      <div>
        <PageHeader
          title={isParent ? "Child's Result View" : "Result View"}
          breadcrumb={[{ label: isParent ? 'Child Results' : 'Marks', href: isParent ? '/marks/results' : '/marks' }, { label: 'Result View' }]}
        />
        <Card>
          <EmptyState title="Loading..." description="Fetching results" />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Result View"
        description="View examination results and performance summaries"
        breadcrumb={[
          { label: 'Marks', href: '/marks' },
          { label: 'Result View' },
        ]}
        actions={
          <Link to="/marks">
            <Button variant="outline" leftIcon={ArrowLeft}>Back to Marks</Button>
          </Link>
        }
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Select
          label="Select Exam"
          value={examId}
          onChange={(event) => setExamId(event.target.value)}
          options={exams.map((exam) => ({ value: exam.id, label: `${exam.name} - ${exam.className} (${exam.subject})` }))}
          placeholder="Choose an exam to view results"
          className="max-w-xl"
        />
      </div>

      {!selectedExam ? (
        <Card>
          <EmptyState
            title="No exam selected"
            description="Select an exam to view its results."
            icon={Table2}
          />
        </Card>
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><ClipboardCheck size={22} /></div>
              <div>
                <p className="text-xs text-slate-500">Students Appeared</p>
                <p className="text-lg font-bold text-slate-900">{summary.total}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp size={22} /></div>
              <div>
                <p className="text-xs text-slate-500">Class Average</p>
                <p className="text-lg font-bold text-emerald-600">{summary.average}%</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Trophy size={22} /></div>
              <div>
                <p className="text-xs text-slate-500">Highest Score</p>
                <p className="truncate text-lg font-bold text-slate-900">{summary.highest.student.fullName}</p>
                <p className="text-xs text-slate-400">{summary.highest.percent}%</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><TrendingDown size={22} /></div>
              <div>
                <p className="text-xs text-slate-500">Lowest Score</p>
                <p className="truncate text-lg font-bold text-slate-900">{summary.lowest.student.fullName}</p>
                <p className="text-xs text-slate-400">{summary.lowest.percent}%</p>
              </div>
            </Card>
          </div>

          <Card
            title={`Results - ${selectedExam.name}`}
            subtitle={`${selectedExam.className} • ${selectedExam.subject}`}
            className="overflow-hidden"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {['Rank', 'Student', 'Marks', 'Total', 'Percentage', 'Grade', 'Action'].map((header) => (
                      <th key={header} className="px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {results.map((result, index) => {
                      const isChild = isParent && (
                        user?.children?.some((c) => c.id === result.student.id || c.studentId === result.student.studentId) ||
                        result.student.parentId === user?.parentId
                      )
                      return (
                        <tr
                          key={result.student.id}
                          className={`transition-colors ${isChild ? 'bg-amber-50/60 font-medium' : 'hover:bg-slate-50/60'}`}
                        >
                          <td className="px-5 py-3.5">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={result.student.fullName} size="sm" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-900">{result.student.fullName}</p>
                                  {isChild && (
                                    <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                      Your Child
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-mono">
                                  {result.student.studentId || result.student.id}
                                  {result.student.rollNumber !== undefined && result.student.rollNumber !== '' ? ` • Roll No: ${result.student.rollNumber}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {result.marks.map((mark) => (
                          <span key={mark.subject} className="mr-2 inline-block">
                            {mark.subject}: <strong>{mark.marks}</strong>
                          </span>
                        ))}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{result.total}/{result.maxTotal}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${result.percent >= 60 ? 'bg-emerald-500' : result.percent >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${result.percent}%` }} />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{result.percent}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={`${result.color === 'text-rose-600' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {result.grade}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={GraduationCap}
                          onClick={() => {
                            setSelectedStudentForMarksheet(result.student)
                            setMarksheetModalOpen(true)
                          }}
                        >
                          Marksheet
                        </Button>
                      </td>
                    </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Marksheet Modal */}
          {selectedStudentForMarksheet && examId && (
            <MarksheetModal
              open={marksheetModalOpen}
              onClose={() => setMarksheetModalOpen(false)}
              studentId={selectedStudentForMarksheet.id}
              examId={examId}
            />
          )}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No results yet"
            description="Marks have not been entered for this exam."
            icon={Table2}
            actionLabel="Enter Marks"
            onAction={() => navigate('/marks/entry')}
          />
        </Card>
      )}
    </div>
  )
}

export default ResultView
