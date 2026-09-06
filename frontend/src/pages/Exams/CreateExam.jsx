import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  FileText,
  Monitor,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import QuestionDiscoveryModal from '../../components/exams/QuestionDiscoveryModal'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { todayISO } from '../../utils/helpers'

const EXAM_TYPES = [
  { id: 'NORMAL', label: 'Paper / Printed Exam', desc: 'Generate printable Question Paper with Answer Key & Marking Scheme', icon: FileText },
  { id: 'DIGITAL', label: 'Digital Online Exam', desc: 'Students attempt online with live timer, auto-grading & subjective evaluation', icon: Monitor },
]

const BOARD_OPTIONS = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'STATE_BOARD', label: 'State Board' },
  { value: 'OTHER', label: 'Other' },
]

export default function CreateExam() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Real Database Classes & Subjects
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Exam Meta Form
  const [type, setType] = useState('NORMAL')
  const [name, setName] = useState('')
  const [classId, setClassId] = useState('')
  const [className, setClassName] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [board, setBoard] = useState('CBSE')
  const [startDate, setStartDate] = useState(todayISO())
  const [durationMinutes, setDurationMinutes] = useState(180)
  const [passingMarks, setPassingMarks] = useState(33)
  const [instructions, setInstructions] = useState(
    '1. All questions are compulsory.\n2. Write answers clearly and concisely.\n3. Verify your answers before submitting.'
  )

  // Questions state
  const [questions, setQuestions] = useState([])
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [manualDraft, setManualDraft] = useState({
    text: '',
    type: 'SHORT_ANSWER',
    difficulty: 'MEDIUM',
    marks: 2,
    correctAnswer: '',
    explanation: '',
    rubric: '',
    sectionName: 'Section A',
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Load classes and subjects from real database
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingOptions(true)
        const [clsData, subData] = await Promise.all([
          api.getClasses(),
          api.getSubjects(),
        ])
        setClasses(clsData || [])
        setSubjects(subData || [])
      } catch (err) {
        console.error('Error loading classes/subjects:', err)
      } finally {
        setLoadingOptions(false)
      }
    }
    loadData()
  }, [])

  // Auto-fill class name when classId changes
  const handleClassChange = (e) => {
    const cid = e.target.value
    setClassId(cid)
    const selected = classes.find((c) => c.id === cid)
    if (selected) {
      setClassName(`${selected.name} ${selected.section || ''}`.trim())
    } else {
      setClassName('')
    }
    if (errors.classId) setErrors((prev) => ({ ...prev, classId: '' }))
  }

  // Calculate dynamic total marks from added questions
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)

  // Add question from Discovery Modal
  const handleAddQuestionFromDiscovery = (newQ) => {
    setQuestions((prev) => [
      ...prev,
      {
        ...newQ,
        order: prev.length + 1,
        sectionName: newQ.sectionName || 'Section A',
        marks: Number(newQ.marks) || 1,
      },
    ])
  }

  // Add manual question
  const handleAddManualQuestion = (e) => {
    e.preventDefault()
    if (!manualDraft.text.trim()) {
      showToast('Question text is required', 'error')
      return
    }
    setQuestions((prev) => [
      ...prev,
      {
        ...manualDraft,
        order: prev.length + 1,
        marks: Number(manualDraft.marks) || 1,
        source: 'SCHOOL_BANK',
        sourceName: 'Teacher Created',
      },
    ])
    setManualModalOpen(false)
    setManualDraft({
      text: '',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      marks: 2,
      correctAnswer: '',
      explanation: '',
      rubric: '',
      sectionName: 'Section A',
    })
    showToast('Question added to exam', 'success')
  }

  // Delete question
  const handleDeleteQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  // Re-order questions
  const handleMove = (idx, direction) => {
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === questions.length - 1)
    ) {
      return
    }
    const newQuestions = [...questions]
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    const temp = newQuestions[idx]
    newQuestions[idx] = newQuestions[targetIdx]
    newQuestions[targetIdx] = temp
    setQuestions(newQuestions)
  }

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!name.trim()) nextErrors.name = 'Exam name is required'
    if (!classId) nextErrors.classId = 'Please select a class'
    if (!subjectName.trim()) nextErrors.subjectName = 'Please select or enter a subject'
    if (!startDate) nextErrors.startDate = 'Exam date is required'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      showToast('Please fill all required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name,
        classId,
        type,
        status: 'DRAFT',
        board,
        subjectName,
        totalMarks: totalMarks > 0 ? totalMarks : 100,
        passingMarks: Number(passingMarks) || 33,
        durationMinutes: Number(durationMinutes) || 180,
        instructions,
        startDate: new Date(startDate),
        endDate: new Date(startDate),
        questions: questions.map((q, idx) => ({
          questionId: q.id || undefined,
          text: q.text,
          type: q.type || 'SHORT_ANSWER',
          difficulty: q.difficulty || 'MEDIUM',
          marks: Number(q.marks) || 1,
          sectionName: q.sectionName || 'Section A',
          order: idx + 1,
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          explanation: q.explanation || '',
          rubric: q.rubric || '',
          source: q.source || 'SCHOOL_BANK',
          sourceName: q.sourceName || 'Teacher Created',
          sourceUrl: q.sourceUrl || '',
          license: q.license || 'Educational Use',
        })),
      }

      const created = await api.addExam(payload)
      showToast(`Exam "${name}" created successfully with ${questions.length} questions!`, 'success')
      if (type === 'NORMAL') {
        navigate(`/exams/${created.id}/paper`)
      } else {
        navigate('/exams')
      }
    } catch (err) {
      console.error('Failed to create exam:', err)
      showToast(err.message || 'Failed to create exam', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Create Examination"
        description="Schedule a new examination with question paper generation or digital online testing"
        breadcrumb={[
          { label: 'Exams', href: '/exams' },
          { label: 'Create Exam' },
        ]}
        actions={
          <Link to="/exams">
            <Button variant="outline" leftIcon={ArrowLeft}>
              Back to Exams
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Type Selection Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXAM_TYPES.map((t) => {
            const Icon = t.icon
            const isSelected = type === t.id
            return (
              <div
                key={t.id}
                onClick={() => setType(t.id)}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t.label}</h3>
                    <p className="text-xs text-slate-500">{t.desc}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Exam Metadata Card */}
        <Card>
          <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Examination Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Exam Title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
              placeholder="e.g. Mid-Term Examination 2026"
            />

            <Select
              label="Class"
              value={classId}
              onChange={handleClassChange}
              error={errors.classId}
              required
              options={classes.map((c) => ({
                value: c.id,
                label: `${c.name} ${c.section || ''}`.trim(),
              }))}
              placeholder={loadingOptions ? 'Loading classes...' : 'Select Class'}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                list="subject-suggestions"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Science, Mathematics"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <datalist id="subject-suggestions">
                {subjects.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
              {errors.subjectName && (
                <p className="mt-1 text-xs text-rose-500">{errors.subjectName}</p>
              )}
            </div>

            <Select
              label="Board / Curriculum"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              options={BOARD_OPTIONS}
            />

            <Input
              label="Examination Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={errors.startDate}
              required
            />

            <Input
              label="Duration (Minutes)"
              type="number"
              min="15"
              max="360"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="180"
            />

            <Input
              label="Passing Marks"
              type="number"
              min="1"
              max="200"
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              placeholder="33"
            />

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                General Instructions for Students
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions printed on top of the question paper..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* Question Assembly Section */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Questions &amp; Paper Sections</h3>
                <Badge className="bg-indigo-50 font-bold text-indigo-700">
                  {questions.length} Question{questions.length !== 1 ? 's' : ''}
                </Badge>
                <Badge className="bg-emerald-50 font-bold text-emerald-700">
                  Total: {totalMarks} Marks
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Add curriculum-aligned questions from official OER sources or create custom questions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                leftIcon={Plus}
                onClick={() => setManualModalOpen(true)}
              >
                Custom Question
              </Button>
              <Button
                type="button"
                leftIcon={Sparkles}
                onClick={() => setIsDiscoveryOpen(true)}
                className="bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-xs hover:from-indigo-700 hover:to-violet-700"
              >
                Find &amp; Match Questions
              </Button>
            </div>
          </div>

          {/* Question List */}
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BookOpen size={28} />
              </div>
              <h4 className="text-base font-semibold text-slate-800">No Questions Added Yet</h4>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Click <strong>&quot;Find &amp; Match Questions&quot;</strong> to search open educational question banks (NCERT, CBSE, OpenStax) or add your own questions.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  leftIcon={Sparkles}
                  onClick={() => setIsDiscoveryOpen(true)}
                >
                  Find Questions
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                      Q{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {q.sectionName || 'Section A'}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          {q.type?.replace(/_/g, ' ') || 'SHORT ANSWER'}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          {q.difficulty || 'MEDIUM'}
                        </span>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                          {q.marks || 1} Mark{q.marks > 1 ? 's' : ''}
                        </span>
                        {q.sourceName && (
                          <span className="text-[11px] text-slate-400">
                            Source: {q.sourceName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 leading-snug">{q.text}</p>
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          {q.options.map((opt, i) => (
                            <span key={i} className="rounded border border-slate-200 px-2 py-0.5">
                              {String.fromCharCode(65 + i)}. {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Move up/down, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Up"
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                    >
                      <MoveUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      title="Move Down"
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                    >
                      <MoveDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      title="Remove Question"
                      className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Submit Bar */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/exams')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} leftIcon={CheckCircle2}>
            {type === 'NORMAL' ? 'Create Exam & View Question Paper' : 'Schedule Digital Exam'}
          </Button>
        </div>
      </form>

      {/* Question Discovery & Matching Modal */}
      <QuestionDiscoveryModal
        isOpen={isDiscoveryOpen}
        onClose={() => setIsDiscoveryOpen(false)}
        initialClass={className || 'Class 10'}
        initialSubject={subjectName || 'Science'}
        existingExamQuestions={questions}
        onAddQuestionToExam={handleAddQuestionFromDiscovery}
      />

      {/* Custom Question Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Custom Question</h3>
            <form onSubmit={handleAddManualQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-slate-700">Question Text</label>
                <textarea
                  rows={3}
                  required
                  value={manualDraft.text}
                  onChange={(e) => setManualDraft((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Enter question text..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Question Type"
                  value={manualDraft.type}
                  onChange={(e) => setManualDraft((p) => ({ ...p, type: e.target.value }))}
                  options={[
                    { value: 'SHORT_ANSWER', label: 'Short Answer' },
                    { value: 'LONG_ANSWER', label: 'Long Answer' },
                    { value: 'MCQ', label: 'Multiple Choice' },
                    { value: 'NUMERICAL', label: 'Numerical' },
                  ]}
                />
                <Input
                  label="Marks"
                  type="number"
                  min="1"
                  max="100"
                  value={manualDraft.marks}
                  onChange={(e) => setManualDraft((p) => ({ ...p, marks: Number(e.target.value) }))}
                />
              </div>

              <Input
                label="Exam Section"
                value={manualDraft.sectionName}
                onChange={(e) => setManualDraft((p) => ({ ...p, sectionName: e.target.value }))}
                placeholder="Section A, Section B..."
              />

              <Input
                label="Correct Answer (Optional)"
                value={manualDraft.correctAnswer}
                onChange={(e) => setManualDraft((p) => ({ ...p, correctAnswer: e.target.value }))}
                placeholder="Answer key for evaluation"
              />

              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setManualModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Question</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
