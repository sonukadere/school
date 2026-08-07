import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Avatar from '../../components/common/Avatar'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { gradeFromPercentage, percentage } from '../../utils/helpers'

function MarksEntry() {
  const { showToast } = useToast()
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [allMarks, setAllMarks] = useState([])
  const [examId, setExamId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [marks, setMarks] = useState('')
  const [maxMarks, setMaxMarks] = useState(100)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([api.getExams(), api.getStudents(), api.getMarks()]).then(([examData, studentData, markData]) => {
      if (mounted) {
        setExams(examData)
        setStudents(studentData)
        setAllMarks(markData)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const selectedExam = exams.find((exam) => exam.id === examId)
  const examStudents = useMemo(
    () => students.filter((student) => !selectedExam || student.className === selectedExam.className),
    [students, selectedExam],
  )

  const selectedStudent = students.find((student) => student.id === studentId)

  const existingRecord = useMemo(() => {
    if (!examId || !studentId || !selectedExam) return null
    return allMarks.find(
      (mark) => mark.examId === examId && mark.studentId === studentId && mark.subject === selectedExam.subject,
    )
  }, [allMarks, examId, studentId, selectedExam])

  const percent = marks !== '' ? percentage(Number(marks), Number(maxMarks)) : null
  const grade = percent !== null ? gradeFromPercentage(percent) : null

  const handleSave = async () => {
    if (!examId || !studentId) {
      showToast('Select an exam and a student', 'error')
      return
    }
    if (marks === '' || Number(marks) < 0 || Number(marks) > Number(maxMarks)) {
      showToast(`Enter marks between 0 and ${maxMarks}`, 'error')
      return
    }
    setSaving(true)
    const payload = {
      studentId,
      examId,
      subject: selectedExam.subject,
      marks: Number(marks),
      maxMarks: Number(maxMarks),
    }
    if (existingRecord) {
      await api.updateMark(existingRecord.id, payload)
    } else {
      await api.addMark(payload)
    }
    setSaving(false)
    showToast('Marks saved successfully', 'success')
    const fresh = await api.getMarks()
    setAllMarks(fresh)
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Marks Entry" breadcrumb={[{ label: 'Marks', href: '/marks' }, { label: 'Marks Entry' }]} />
        <Card>
          <EmptyState title="Loading..." description="Fetching exam and student data" />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Marks Entry"
        description="Record subject marks for a student in an exam"
        breadcrumb={[
          { label: 'Marks', href: '/marks' },
          { label: 'Marks Entry' },
        ]}
        actions={
          <Link to="/marks">
            <Button variant="outline" leftIcon={ArrowLeft}>Back to Marks</Button>
          </Link>
        }
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Exam"
            value={examId}
            onChange={(event) => {
              setExamId(event.target.value)
              setStudentId('')
              setMarks('')
            }}
            options={exams.map((exam) => ({ value: exam.id, label: `${exam.name} - ${exam.className} (${exam.subject})` }))}
            placeholder="Select exam"
          />
          <Select
            label="Student"
            value={studentId}
            onChange={(event) => {
              const sid = event.target.value
              setStudentId(sid)
              const record = allMarks.find(
                (mark) => mark.examId === examId && mark.studentId === sid && mark.subject === selectedExam.subject,
              )
              setMarks(record ? String(record.marks) : '')
            }}
            options={examStudents.map((student) => ({ value: student.id, label: `${student.fullName} (${student.id})` }))}
            placeholder={selectedExam ? 'Select student' : 'Select exam first'}
            disabled={!selectedExam}
          />
          <Input
            label="Maximum Marks"
            type="number"
            value={maxMarks}
            onChange={(event) => setMaxMarks(event.target.value)}
          />
        </div>
      </div>

      {!selectedExam || !selectedStudent ? (
        <Card>
          <EmptyState
            title="Select exam and student"
            description="Choose an exam and a student to enter marks."
            icon={Calculator}
          />
        </Card>
      ) : (
        <Card title={`Enter Marks - ${selectedExam.subject}`} subtitle={`${selectedExam.name} • ${selectedExam.className}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={selectedStudent.fullName} size="lg" />
              <div>
                <p className="text-lg font-bold text-slate-900">{selectedStudent.fullName}</p>
                <p className="text-sm text-slate-500">
                  {selectedStudent.id} • {selectedStudent.className} - {selectedStudent.section}
                </p>
              </div>
            </div>
            <div className="w-full max-w-xs space-y-4">
              <Input
                label={`Marks Obtained (out of ${maxMarks})`}
                type="number"
                value={marks}
                onChange={(event) => setMarks(event.target.value)}
                placeholder="Enter marks"
                required
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-lg font-bold text-slate-900">
                    {marks !== '' ? `${marks}/${maxMarks}` : '—'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Percentage</span>
                  <span className="text-lg font-bold text-slate-900">{percent !== null ? `${percent}%` : '—'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Grade</span>
                  {grade ? (
                    <Badge className={grade.color === 'text-rose-600' ? 'bg-rose-100 text-rose-700' : `bg-emerald-100 ${grade.color}`}>
                      {grade.grade}
                    </Badge>
                  ) : (
                    <span className="text-lg text-slate-300">—</span>
                  )}
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} loading={saving} leftIcon={Save}>
                Save Marks
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default MarksEntry
