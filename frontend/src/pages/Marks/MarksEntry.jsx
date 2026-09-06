import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Calculator, Users, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react'
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
  const [subjects, setSubjects] = useState([])
  const [allMarks, setAllMarks] = useState([])
  const [examId, setExamId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [marks, setMarks] = useState('')
  const [maxMarks, setMaxMarks] = useState(100)
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [entryMode, setEntryMode] = useState('single') // 'single' | 'batch'
  const [batchMarks, setBatchMarks] = useState({}) // { [studentId]: marksValue }

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [examData, studentData, subjectData, markData] = await Promise.all([
        api.getExams(),
        api.getStudents(),
        api.getSubjects(),
        api.getMarks(),
      ])
      setExams(Array.isArray(examData) ? examData : [])
      setStudents(Array.isArray(studentData) ? studentData : [])
      setSubjects(Array.isArray(subjectData) ? subjectData : [])
      setAllMarks(Array.isArray(markData) ? markData : [])
    } catch (err) {
      console.error('[MarksEntry] Error loading initial data:', err)
      showToast(err.message || 'Failed to fetch exam and student data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Currently selected exam
  const selectedExam = useMemo(() => exams.find((e) => e.id === examId), [exams, examId])

  // Filter subjects for the selected exam's class
  const classSubjects = useMemo(() => {
    if (!selectedExam) return subjects
    const filtered = subjects.filter(
      (s) =>
        (selectedExam.classId && s.classId === selectedExam.classId) ||
        (s.className && selectedExam.className && s.className.toLowerCase() === selectedExam.className.toLowerCase()),
    )
    return filtered.length > 0 ? filtered : subjects
  }, [subjects, selectedExam])

  // Currently selected subject
  const selectedSubject = useMemo(
    () => classSubjects.find((s) => s.id === subjectId) || subjects.find((s) => s.id === subjectId),
    [classSubjects, subjects, subjectId],
  )

  // Filter students enrolled in the selected exam's class
  const examStudents = useMemo(() => {
    if (!selectedExam) return students
    return students.filter(
      (s) =>
        (selectedExam.classId && s.classId === selectedExam.classId) ||
        s.className === selectedExam.className ||
        `${s.className} ${s.section}`.trim() === selectedExam.className,
    )
  }, [students, selectedExam])

  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId])

  // Sync batch marks when exam, subject, or marks list changes
  useEffect(() => {
    if (!examId || !subjectId) {
      setBatchMarks({})
      return
    }
    const map = {}
    examStudents.forEach((st) => {
      const rec = allMarks.find(
        (m) =>
          m.examId === examId &&
          (m.subjectId === subjectId || (selectedSubject && m.subject === selectedSubject.name)) &&
          m.studentId === st.id,
      )
      if (rec) {
        map[st.id] = String(rec.marks)
      }
    })
    setBatchMarks(map)
  }, [examId, subjectId, examStudents, allMarks, selectedSubject])

  // Sync single student mark when student, subject, or exam changes
  useEffect(() => {
    if (!examId || !studentId || !subjectId) {
      setMarks('')
      setRemarks('')
      return
    }
    const record = allMarks.find(
      (m) =>
        m.examId === examId &&
        (m.subjectId === subjectId || (selectedSubject && m.subject === selectedSubject.name)) &&
        m.studentId === studentId,
    )
    if (record) {
      setMarks(String(record.marks))
      setRemarks(record.remarks || '')
    } else {
      setMarks('')
      setRemarks('')
    }
  }, [examId, studentId, subjectId, allMarks, selectedSubject])

  const existingRecord = useMemo(() => {
    if (!examId || !studentId || !subjectId) return null
    return allMarks.find(
      (m) =>
        m.examId === examId &&
        (m.subjectId === subjectId || (selectedSubject && m.subject === selectedSubject.name)) &&
        m.studentId === studentId,
    )
  }, [allMarks, examId, studentId, subjectId, selectedSubject])

  const percent = marks !== '' && !isNaN(Number(marks)) ? percentage(Number(marks), Number(maxMarks)) : null
  const grade = percent !== null ? gradeFromPercentage(percent) : null

  // Save single student marks
  const handleSaveSingle = async () => {
    if (!examId) {
      showToast('Please select an exam', 'error')
      return
    }
    if (!subjectId) {
      showToast('Please select a subject', 'error')
      return
    }
    if (!studentId) {
      showToast('Please select a student', 'error')
      return
    }
    const numMarks = Number(marks)
    if (marks === '' || isNaN(numMarks) || numMarks < 0 || numMarks > Number(maxMarks)) {
      showToast(`Enter valid marks between 0 and ${maxMarks}`, 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        studentId,
        examId,
        subjectId,
        marks: numMarks,
        maxMarks: Number(maxMarks),
        grade: grade?.grade || 'A',
        remarks: remarks.trim() || null,
      }

      if (existingRecord) {
        await api.updateMark(existingRecord.id, payload)
        showToast(`Marks updated for ${selectedStudent?.fullName}`, 'success')
      } else {
        await api.addMark(payload)
        showToast(`Marks recorded for ${selectedStudent?.fullName}`, 'success')
      }

      const freshMarks = await api.getMarks()
      setAllMarks(Array.isArray(freshMarks) ? freshMarks : [])
    } catch (err) {
      console.error('[MarksEntry] Save error:', err)
      showToast(err.message || 'Failed to save marks', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Save all batch marks for class
  const handleSaveBatch = async () => {
    if (!examId || !subjectId) {
      showToast('Please select an exam and a subject first', 'error')
      return
    }

    const enteredStudentIds = Object.keys(batchMarks).filter(
      (sid) => batchMarks[sid] !== '' && !isNaN(Number(batchMarks[sid])),
    )

    if (enteredStudentIds.length === 0) {
      showToast('Please enter marks for at least one student', 'error')
      return
    }

    setSaving(true)
    try {
      let savedCount = 0
      for (const sid of enteredStudentIds) {
        const val = Number(batchMarks[sid])
        if (val < 0 || val > Number(maxMarks)) continue

        const p = percentage(val, Number(maxMarks))
        const g = gradeFromPercentage(p)

        const existing = allMarks.find(
          (m) =>
            m.examId === examId &&
            (m.subjectId === subjectId || (selectedSubject && m.subject === selectedSubject.name)) &&
            m.studentId === sid,
        )

        const payload = {
          studentId: sid,
          examId,
          subjectId,
          marks: val,
          maxMarks: Number(maxMarks),
          grade: g.grade,
        }

        if (existing) {
          await api.updateMark(existing.id, payload)
        } else {
          await api.addMark(payload)
        }
        savedCount++
      }

      showToast(`Successfully saved marks for ${savedCount} student(s)`, 'success')
      const freshMarks = await api.getMarks()
      setAllMarks(Array.isArray(freshMarks) ? freshMarks : [])
    } catch (err) {
      console.error('[MarksEntry] Batch save error:', err)
      showToast(err.message || 'Failed to save batch marks', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Marks Entry" breadcrumb={[{ label: 'Marks', href: '/marks' }, { label: 'Marks Entry' }]} />
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 animate-pulse">
              <BookOpen size={24} />
            </div>
            <p className="text-base font-semibold text-slate-900">Loading Database Records...</p>
            <p className="text-xs text-slate-500 mt-1">Fetching exams, subjects, and student rosters from the database</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marks Entry"
        description="Record and update subject marks dynamically from the database"
        breadcrumb={[{ label: 'Marks', href: '/marks' }, { label: 'Marks Entry' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200/80 bg-slate-100/80 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEntryMode('single')}
                className={`rounded-md px-3 py-1.5 transition ${
                  entryMode === 'single' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Individual Entry
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('batch')}
                className={`rounded-md px-3 py-1.5 transition ${
                  entryMode === 'batch' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Batch Class Entry
              </button>
            </div>
            <Link to="/marks">
              <Button variant="outline" leftIcon={ArrowLeft}>
                Back to Marks
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter Selection Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Exam Selector */}
          <Select
            label="Select Exam"
            value={examId}
            onChange={(event) => {
              setExamId(event.target.value)
              setSubjectId('')
              setStudentId('')
              setMarks('')
            }}
            options={exams.map((exam) => ({
              value: exam.id,
              label: `${exam.name} • ${exam.className || 'All Classes'}`,
            }))}
            placeholder="Choose an exam..."
          />

          {/* Subject Selector */}
          <Select
            label="Select Subject"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value)
              setMarks('')
            }}
            options={classSubjects.map((sub) => ({
              value: sub.id,
              label: `${sub.name} (${sub.code || sub.name.slice(0, 3)})`,
            }))}
            placeholder={selectedExam ? 'Choose subject...' : 'Select exam first'}
            disabled={!selectedExam}
          />

          {/* Student Selector (Only for Single mode) */}
          {entryMode === 'single' ? (
            <Select
              label="Select Student"
              value={studentId}
              onChange={(event) => {
                setStudentId(event.target.value)
              }}
              options={examStudents.map((st) => ({
                value: st.id,
                label: `${st.fullName} (Roll: ${st.rollNumber ?? '—'})`,
              }))}
              placeholder={selectedExam ? 'Choose student...' : 'Select exam first'}
              disabled={!selectedExam}
            />
          ) : (
            <div className="flex flex-col justify-end">
              <span className="text-xs font-semibold text-slate-500 mb-1.5">Class Students</span>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                <Users size={16} className="text-slate-400" />
                <span>{examStudents.length} Students in roster</span>
              </div>
            </div>
          )}

          {/* Max Marks */}
          <Input
            label="Maximum Marks"
            type="number"
            value={maxMarks}
            onChange={(event) => setMaxMarks(event.target.value)}
            min="1"
            max="500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {!selectedExam ? (
        <Card>
          <EmptyState
            title="Select an Exam"
            description="Choose an examination from the dropdown above to load the dynamic student roster and subjects."
            icon={Calculator}
          />
        </Card>
      ) : !subjectId ? (
        <Card>
          <EmptyState
            title="Select a Subject"
            description={`Please pick a subject for ${selectedExam.name} (${selectedExam.className || 'Class'}) to begin entering marks.`}
            icon={BookOpen}
          />
        </Card>
      ) : entryMode === 'batch' ? (
        /* Batch Entry Mode: Table of all students in class */
        <Card
          title={`Batch Marks Entry — ${selectedSubject?.name || 'Subject'}`}
          subtitle={`${selectedExam.name} • ${selectedExam.className} • ${examStudents.length} Students`}
          actions={
            <Button onClick={handleSaveBatch} loading={saving} leftIcon={Save}>
              Save All Marks
            </Button>
          }
        >
          {examStudents.length === 0 ? (
            <EmptyState
              title="No students found in class"
              description="No students are enrolled in this class yet. Add students to enter marks."
              icon={Users}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/80 text-left">
                <thead className="bg-slate-50/75">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Roll No
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Student
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Marks (out of {maxMarks})
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Percentage
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Grade
                    </th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {examStudents.map((st) => {
                    const stMarks = batchMarks[st.id] ?? ''
                    const numVal = Number(stMarks)
                    const hasValidMarks = stMarks !== '' && !isNaN(numVal) && numVal >= 0 && numVal <= Number(maxMarks)
                    const stPercent = hasValidMarks ? percentage(numVal, Number(maxMarks)) : null
                    const stGrade = stPercent !== null ? gradeFromPercentage(stPercent) : null
                    const isAlreadySaved = allMarks.some(
                      (m) =>
                        m.examId === examId &&
                        (m.subjectId === subjectId || (selectedSubject && m.subject === selectedSubject.name)) &&
                        m.studentId === st.id,
                    )

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 text-xs font-mono font-medium text-slate-600">
                          {st.rollNumber ? `#${st.rollNumber}` : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={st.fullName} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{st.fullName}</p>
                              <p className="text-[11px] font-mono text-slate-400">
                                {st.studentId || st.id.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 w-40">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={stMarks}
                            onChange={(e) => {
                              const val = e.target.value
                              setBatchMarks((prev) => ({ ...prev, [st.id]: val }))
                            }}
                            placeholder="Enter score"
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-sm font-semibold text-slate-800 transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                          />
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-slate-700">
                          {stPercent !== null ? `${stPercent}%` : '—'}
                        </td>
                        <td className="px-5 py-3">
                          {stGrade ? (
                            <Badge
                              className={
                                stGrade.color === 'text-rose-600'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              }
                            >
                              {stGrade.grade}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {isAlreadySaved ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                              <CheckCircle2 size={13} className="text-emerald-500" /> Saved
                            </span>
                          ) : hasValidMarks ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                              <AlertCircle size={13} className="text-indigo-500" /> Ready
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Pending</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        /* Individual Entry Mode */
        !selectedStudent ? (
          <Card>
            <EmptyState
              title="Select a Student"
              description="Choose a student from the dropdown above to enter or update their examination marks."
              icon={Users}
            />
          </Card>
        ) : (
          <Card
            title={`Enter Marks — ${selectedSubject?.name || 'Subject'}`}
            subtitle={`${selectedExam.name} • ${selectedExam.className}`}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={selectedStudent.fullName} size="lg" />
                <div>
                  <p className="text-lg font-bold text-slate-900">{selectedStudent.fullName}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Student ID: {selectedStudent.studentId || selectedStudent.id.slice(-6)} &bull; Roll: #
                    {selectedStudent.rollNumber ?? 'N/A'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="primary">{selectedStudent.className || selectedExam.className}</Badge>
                    <Badge variant="info">Section {selectedStudent.section || 'A'}</Badge>
                    {existingRecord && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                        <CheckCircle2 size={12} /> Existing Score: {existingRecord.marks}/{maxMarks}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full max-w-sm space-y-4">
                <Input
                  label={`Marks Obtained (out of ${maxMarks})`}
                  type="number"
                  value={marks}
                  onChange={(event) => setMarks(event.target.value)}
                  placeholder={`Enter score 0 - ${maxMarks}`}
                  min="0"
                  max={maxMarks}
                  required
                />

                <Input
                  label="Remarks (Optional)"
                  type="text"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="e.g. Excellent conceptual grasp"
                />

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total Score</span>
                    <span className="text-base font-bold text-slate-900">
                      {marks !== '' ? `${marks} / ${maxMarks}` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Percentage</span>
                    <span className="text-base font-bold text-slate-900">
                      {percent !== null ? `${percent}%` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Grade</span>
                    {grade ? (
                      <Badge
                        className={
                          grade.color === 'text-rose-600'
                            ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        }
                      >
                        {grade.grade}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={handleSaveSingle} loading={saving} leftIcon={Save}>
                  {existingRecord ? 'Update Marks' : 'Save Marks'}
                </Button>
              </div>
            </div>
          </Card>
        )
      )}
    </div>
  )
}

export default MarksEntry
