import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Award,
  GraduationCap,
  Printer,
  FileCheck,
  Search,
  Sparkles,
  Users,
  User,
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  PenLine,
  Table2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Download,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import Badge from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import MarksheetDocument from '../../components/marksheets/MarksheetDocument'
import MarksheetModal from '../../components/marksheets/MarksheetModal'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

function GenerateMarksheet() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [mode, setMode] = useState('single') // 'single' | 'class'
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [exams, setExams] = useState([])

  // Selections
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '')
  const [selectedExamId, setSelectedExamId] = useState(searchParams.get('examId') || '')

  // Generated results
  const [generating, setGenerating] = useState(false)
  const [singleMarksheet, setSingleMarksheet] = useState(null)
  const [classMarksheets, setClassMarksheets] = useState(null)
  const [generationError, setGenerationError] = useState(null)

  // Modal for quick popup preview in class view
  const [modalStudentId, setModalStudentId] = useState(null)
  const [modalExamId, setModalExamId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoadingInitial(true)

    Promise.all([api.getClasses(), api.getStudents(), api.getExams()])
      .then(([classData, studentData, examData]) => {
        if (!isMounted) return
        const loadedClasses = Array.isArray(classData) ? classData : []
        const loadedStudents = Array.isArray(studentData) ? studentData : []
        const loadedExams = Array.isArray(examData) ? examData : []

        setClasses(loadedClasses)
        setStudents(loadedStudents)
        setExams(loadedExams)

        // If studentId was in URL params, pre-select class
        const initialStudent = loadedStudents.find((s) => s.id === (searchParams.get('studentId') || ''))
        if (initialStudent) {
          const matchClass = loadedClasses.find(
            (c) => c.id === initialStudent.classId || c.name === initialStudent.className
          )
          if (matchClass) setSelectedClassId(matchClass.id)
        }

        setLoadingInitial(false)
      })
      .catch((err) => {
        console.error('Failed to load initial data for marksheets:', err)
        if (isMounted) {
          setLoadingInitial(false)
          showToast('Failed to load classes or students', 'error')
        }
      })

    return () => {
      isMounted = false
    }
  }, [searchParams, showToast])

  // Filter students by selected class
  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return students
    const selectedClassObj = classes.find((c) => c.id === selectedClassId)
    return students.filter((s) => {
      if (s.classId && s.classId === selectedClassId) return true
      if (selectedClassObj && s.className === selectedClassObj.name) {
        if (!selectedClassObj.section || s.section === selectedClassObj.section) return true
      }
      return false
    })
  }, [students, classes, selectedClassId])

  // Filter exams by selected class
  const filteredExams = useMemo(() => {
    if (!selectedClassId) return exams
    const selectedClassObj = classes.find((c) => c.id === selectedClassId)
    return exams.filter((e) => {
      if (e.classId && e.classId === selectedClassId) return true
      if (selectedClassObj && (e.className === selectedClassObj.name || e.class === selectedClassObj.name)) return true
      return true // Include general exams
    })
  }, [exams, classes, selectedClassId])

  // Auto-generate if studentId and examId were provided in query params
  useEffect(() => {
    const qStudent = searchParams.get('studentId')
    const qExam = searchParams.get('examId')
    if (qStudent && qExam && !singleMarksheet && !generating) {
      handleGenerateSingle(qStudent, qExam)
    }
  }, [searchParams])

  const handleGenerateSingle = async (sId = selectedStudentId, eId = selectedExamId) => {
    if (!sId || !eId) {
      showToast('Please select both a student and an exam', 'warning')
      return
    }

    setGenerating(true)
    setGenerationError(null)
    setSingleMarksheet(null)

    try {
      const data = await api.getMarksheet(sId, eId)
      setSingleMarksheet(data)
      setGenerating(false)
      showToast('Marksheet generated successfully!', 'success')
      // Scroll down smoothly to marksheet
      setTimeout(() => {
        const el = document.getElementById('marksheet-result-container')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Marksheet generation error:', err)
      setGenerating(false)
      setGenerationError(err.message || 'No marks found for this student and exam.')
      showToast(err.message || 'Failed to generate marksheet', 'error')
    }
  }

  const handleGenerateClass = async () => {
    if (!selectedClassId || !selectedExamId) {
      showToast('Please select both a class and an exam', 'warning')
      return
    }

    setGenerating(true)
    setGenerationError(null)
    setClassMarksheets(null)

    try {
      const data = await api.getClassMarksheets(selectedClassId, selectedExamId)
      setClassMarksheets(data)
      setGenerating(false)
      showToast(`Generated marksheets for ${Array.isArray(data) ? data.length : 0} students!`, 'success')
    } catch (err) {
      console.error('Class marksheets error:', err)
      setGenerating(false)
      setGenerationError(err.message || 'Failed to generate class marksheets.')
      showToast(err.message || 'Failed to generate class marksheets', 'error')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleReset = () => {
    setSelectedClassId('')
    setSelectedStudentId('')
    setSelectedExamId('')
    setSingleMarksheet(null)
    setClassMarksheets(null)
    setGenerationError(null)
    setSearchParams({})
  }

  if (loadingInitial) {
    return <Loader fullScreen label="Loading examination & student records..." />
  }

  const selectedStudentObj = students.find((s) => s.id === selectedStudentId)
  const selectedExamObj = exams.find((e) => e.id === selectedExamId)

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Generate Marksheet (अंकसूची जनरेट)"
        description="Official statement of marks & examination report card generation for Daily Day Academy"
        showBack={false}
        breadcrumb={[
          { label: 'Marks', href: '/marks' },
          { label: 'Generate Marksheet' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/marks/results">
              <Button variant="outline" size="sm" leftIcon={Table2}>
                Result View
              </Button>
            </Link>
            <Link to="/marks/entry">
              <Button variant="outline" size="sm" leftIcon={PenLine}>
                Marks Entry
              </Button>
            </Link>
          </div>
        }
      />

      {/* Mode & Filters Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm space-y-6">
        {/* Top Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-100 shrink-0">
              <Award size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold tracking-wider uppercase">
                Examination Report Module
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                Marksheet Generator (मार्कशीट जनरेटर)
              </h2>
            </div>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold self-start sm:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setMode('single')
                setClassMarksheets(null)
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                mode === 'single'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold ring-1 ring-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User size={14} /> Individual Student
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('class')
                setSingleMarksheet(null)
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                mode === 'class'
                  ? 'bg-white text-indigo-600 shadow-xs font-bold ring-1 ring-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={14} /> Full Class Batch
            </button>
          </div>
        </div>

        {/* Filter Form Controls */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
          {/* Class Selector */}
          <div>
            <Select
              label="Class & Section (कक्षा)"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                setSelectedStudentId('')
                setSingleMarksheet(null)
                setClassMarksheets(null)
              }}
              options={classes.map((c) => ({
                value: c.id,
                label: `${c.name}${c.section ? ` - Section ${c.section}` : ''}`,
              }))}
              placeholder="All Classes / Select Class"
            />
          </div>

          {/* Student Selector (Only in Single Mode) */}
          {mode === 'single' ? (
            <div>
              <Select
                label="Student (विद्यार्थी) *"
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value)
                  setSingleMarksheet(null)
                }}
                options={filteredStudents.map((s) => ({
                  value: s.id,
                  label: `${s.fullName} ${s.nameInHindi ? `(${s.nameInHindi})` : ''} • ID: ${s.studentId || s.scholarNo || s.id.slice(-4)}${s.rollNumber ? ` • Roll: ${s.rollNumber}` : ''}`,
                }))}
                placeholder={filteredStudents.length === 0 ? 'No students found in class' : 'Select student'}
              />
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600">
              <span className="font-bold text-slate-800 block">Class Summary Mode:</span>
              <span>All students in selected class will be compiled together.</span>
            </div>
          )}

          {/* Exam Selector */}
          <div>
            <Select
              label="Examination (परीक्षा) *"
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value)
                setSingleMarksheet(null)
                setClassMarksheets(null)
              }}
              options={filteredExams.map((e) => ({
                value: e.id,
                label: `${e.name} ${e.className ? `(${e.className})` : ''} ${e.subject ? `• ${e.subject}` : ''}`,
              }))}
              placeholder={filteredExams.length === 0 ? 'No exams found' : 'Select examination'}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-slate-600"
          >
            Reset Filters
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={generating}
              leftIcon={Sparkles}
              onClick={mode === 'single' ? () => handleGenerateSingle() : handleGenerateClass}
              disabled={
                generating ||
                !selectedExamId ||
                (mode === 'single' && !selectedStudentId) ||
                (mode === 'class' && !selectedClassId)
              }
              className="bg-indigo-600 hover:bg-indigo-700 font-bold px-6 shadow-md shadow-indigo-200"
            >
              {mode === 'single' ? 'Generate Marksheet (अंकसूची जनरेट)' : 'Generate Class Marksheets'}
            </Button>
          </div>
        </div>
      </div>

      {/* Generation Error Banner */}
      {generationError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Cannot Generate Marksheet</p>
              <p className="text-xs text-rose-700 mt-0.5">{generationError}</p>
            </div>
          </div>
          <Link to="/marks/entry">
            <Button variant="outline" size="sm" leftIcon={PenLine} className="bg-white border-rose-200 text-rose-700 hover:bg-rose-100 shrink-0">
              Go to Marks Entry
            </Button>
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE STUDENT MARKSHEET DISPLAY                                          */}
      {/* ========================================================================= */}
      {mode === 'single' && singleMarksheet && (
        <div id="marksheet-result-container" className="space-y-4 animate-fade-in">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={22} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Marksheet Ready: {singleMarksheet.student?.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  Total: <strong className="text-slate-800">{singleMarksheet.summary?.totalObtainedMarks} / {singleMarksheet.summary?.totalMaxMarks}</strong> ({singleMarksheet.summary?.percentage}%) • Grade: <strong className="text-indigo-600">{singleMarksheet.summary?.grade || singleMarksheet.summary?.overallGrade?.grade}</strong> • Result: <span className="font-bold text-emerald-600">{singleMarksheet.summary?.resultStatus}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={Printer}
                onClick={handlePrint}
                className="bg-indigo-50/50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-bold"
              >
                Print / Save PDF
              </Button>
            </div>
          </div>

          {/* Marksheet Document */}
          <div className="bg-slate-100/60 p-2 sm:p-6 rounded-3xl border border-slate-200/80">
            <MarksheetDocument marksheet={singleMarksheet} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL CLASS MARKSHEETS TABLE VIEW                                          */}
      {/* ========================================================================= */}
      {mode === 'class' && classMarksheets && (
        <div className="space-y-6 animate-fade-in">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Marksheets</p>
                <p className="text-xl font-bold text-slate-900">{classMarksheets.length}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Class Average</p>
                <p className="text-xl font-bold text-emerald-600">
                  {classMarksheets.length
                    ? Math.round(
                        classMarksheets.reduce((acc, m) => acc + (m.summary?.percentage || 0), 0) /
                          classMarksheets.length
                      )
                    : 0}%
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
                <Award size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Passed Students</p>
                <p className="text-xl font-bold text-slate-900">
                  {classMarksheets.filter((m) => m.summary?.resultStatus === 'PASS' || m.summary?.resultStatus === 'PROMOTED').length} / {classMarksheets.length}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-inner">
                <Printer size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Batch Print</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  leftIcon={Printer}
                  className="mt-1 text-xs font-bold text-indigo-600 border-indigo-200"
                >
                  Print All Marksheets
                </Button>
              </div>
            </Card>
          </div>

          {/* Class Marksheets Table */}
          <Card
            title={`Class Marksheets (${classMarksheets.length} Students)`}
            subtitle="Click on any student to view or print their individual official marksheet"
            className="overflow-hidden"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Roll No</th>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5 text-center">Marks Obtained</th>
                    <th className="px-5 py-3.5 text-center">Percentage</th>
                    <th className="px-5 py-3.5 text-center">Grade</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classMarksheets.map((m, idx) => (
                    <tr key={m.student?.id || idx} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                        {m.student?.rollNumber || idx + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.student?.fullName} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900">{m.student?.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              ID: {m.student?.studentId || m.student?.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                        {m.summary?.totalObtainedMarks} / {m.summary?.totalMaxMarks}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-block font-bold text-slate-800">
                          {m.summary?.percentage}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-700">
                          {m.summary?.grade || m.summary?.overallGrade?.grade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.summary?.resultStatus === 'PASS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : m.summary?.resultStatus === 'PROMOTED'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {m.summary?.resultStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={GraduationCap}
                          onClick={() => {
                            setModalStudentId(m.student?.id)
                            setModalExamId(selectedExamId)
                            setModalOpen(true)
                          }}
                          className="text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                          View & Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Printable all batch marksheets container */}
          <div className="hidden print:block space-y-8">
            {classMarksheets.map((m, idx) => (
              <div key={idx} className="break-after-page">
                <MarksheetDocument marksheet={m} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when nothing generated yet */}
      {!singleMarksheet && !classMarksheets && !generating && (
        <Card className="text-center py-12 px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 mb-4 shadow-inner">
            <GraduationCap size={36} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Generate Official Statement of Marks
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Select an exam and student (or whole class) above, then click <strong>"Generate Marksheet"</strong> to compute marks, percentages, grades, division, and render the print-ready official report card.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/marks/entry">
              <Button variant="outline" size="sm" leftIcon={PenLine}>
                Enter Marks First
              </Button>
            </Link>
            <Link to="/marks/results">
              <Button variant="outline" size="sm" leftIcon={Table2}>
                View Class Results
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Popup Marksheet Modal for Table Row Clicks */}
      {modalOpen && modalStudentId && modalExamId && (
        <MarksheetModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          studentId={modalStudentId}
          examId={modalExamId}
        />
      )}
    </div>
  )
}

export default GenerateMarksheet
