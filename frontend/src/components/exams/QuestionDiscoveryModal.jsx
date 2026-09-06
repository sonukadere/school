import { useState, useEffect } from 'react'
import {
  Search,
  Sparkles,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Filter,
  X,
  Plus,
  Eye,
  Edit3,
  Bookmark,
  ChevronDown,
  Layers,
  Award,
} from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import Badge from '../common/Badge'
import Modal from '../common/Modal'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const QUESTION_TYPE_OPTIONS = [
  { value: '', label: 'All Question Types' },
  { value: 'MCQ', label: 'Multiple Choice (MCQ)' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_ANSWER', label: 'Long Answer' },
  { value: 'NUMERICAL', label: 'Numerical / Problem' },
  { value: 'MATCH_THE_FOLLOWING', label: 'Match the Following' },
  { value: 'CASE_STUDY', label: 'Case Study' },
  { value: 'ASSERTION_REASON', label: 'Assertion & Reason' },
  { value: 'DIAGRAM_BASED', label: 'Diagram Based' },
]

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All Difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
]

const BOARD_OPTIONS = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'STATE_BOARD', label: 'State Board' },
  { value: 'OTHER', label: 'Other' },
]

export default function QuestionDiscoveryModal({
  isOpen,
  onClose,
  initialClass = '',
  initialSubject = '',
  existingExamQuestions = [],
  onAddQuestionToExam,
}) {
  const { showToast } = useToast()

  // Filter state
  const [board, setBoard] = useState('CBSE')
  const [classGrade, setClassGrade] = useState(initialClass)
  const [subject, setSubject] = useState(initialSubject)
  const [chapter, setChapter] = useState('')
  const [topic, setTopic] = useState('')
  const [type, setType] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [marks, setMarks] = useState('')
  const [language, setLanguage] = useState('English')
  const [keywords, setKeywords] = useState('')
  const [includeAI, setIncludeAI] = useState(true)

  // Results state
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [savedToBankIds, setSavedToBankIds] = useState(new Set())

  // Review & Edit Modal State
  const [reviewingQuestion, setReviewingQuestion] = useState(null)
  const [reviewDraft, setReviewDraft] = useState(null)

  // Keep filters updated when modal opens with initial values
  useEffect(() => {
    if (isOpen) {
      if (initialClass) setClassGrade(initialClass)
      if (initialSubject) setSubject(initialSubject)
    }
  }, [isOpen, initialClass, initialSubject])

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setHasSearched(true)
    try {
      const payload = {
        board,
        class: classGrade,
        subject,
        chapter,
        topic,
        type: type || undefined,
        difficulty: difficulty || undefined,
        marks: marks ? Number(marks) : undefined,
        language,
        keywords,
        includeAI,
      }

      const res = await api.matchQuestions(payload)
      const matches = res?.matches || []

      // Enhance with local duplicate detection against current exam questions
      const enhancedMatches = matches.map((item) => {
        const isAlreadyInExam = existingExamQuestions.some(
          (eq) =>
            eq.questionId === item.id ||
            eq.text?.toLowerCase().trim() === item.text?.toLowerCase().trim(),
        )
        return {
          ...item,
          isAlreadyInExam,
        }
      })

      setResults(enhancedMatches)
      if (enhancedMatches.length === 0) {
        showToast('No questions matched the criteria. Try broadening your keywords or filters.', 'info')
      }
    } catch (err) {
      console.error('Failed to match questions:', err)
      showToast(err.message || 'Error matching questions', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Teacher Review initiation
  const handleOpenReview = (question, forceEdit = false) => {
    setReviewingQuestion(question)
    setReviewDraft({
      ...question,
      text: question.text || '',
      type: question.type || 'SHORT_ANSWER',
      difficulty: question.difficulty || 'MEDIUM',
      marks: question.marks || 1,
      options: Array.isArray(question.options) ? [...question.options] : [],
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation || '',
      rubric: question.rubric || '',
      sectionName: question.sectionName || 'Section A',
    })
  }

  // Teacher approves & adds question to exam
  const handleApproveAndAdd = (questionToUse) => {
    const finalQuestion = questionToUse || reviewDraft
    if (!finalQuestion) return

    onAddQuestionToExam(finalQuestion)
    showToast(`Added "${finalQuestion.text.slice(0, 40)}..." to exam`, 'success')
    setReviewingQuestion(null)
    setReviewDraft(null)
  }

  // Save external / AI question to School Question Bank
  const handleSaveToBank = async (item) => {
    try {
      const payload = {
        text: item.text,
        type: item.type || 'SHORT_ANSWER',
        difficulty: item.difficulty || 'MEDIUM',
        marks: Number(item.marks) || 1,
        board: item.board || board || 'CBSE',
        classGrade: item.classGrade || classGrade || 'Class 10',
        subject: item.subject || subject || 'General',
        chapter: item.chapter || chapter || '',
        topic: item.topic || topic || '',
        options: item.options || [],
        correctAnswer: item.correctAnswer || '',
        explanation: item.explanation || '',
        rubric: item.rubric || '',
        source: item.source || 'TEACHER_UPLOADED',
        sourceName: item.sourceName || 'Teacher Reviewed Question',
        sourceUrl: item.sourceUrl || '',
        license: item.license || 'Educational Use',
      }
      await api.addQuestion(payload)
      setSavedToBankIds((prev) => new Set([...prev, item.id || item.text]))
      showToast('Question permanently saved to School Question Bank', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to save question to bank', 'error')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Find & Match Questions</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <Sparkles size={12} /> Open Educational & AI Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Discover syllabus-aligned questions from official OER repositories, School Question Bank, and syllabus AI.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Split into Filters Panel and Results */}
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Left: Filter Form */}
          <div className="w-full border-b border-slate-200 bg-slate-50/70 p-5 md:w-80 md:border-r md:border-b-0 overflow-y-auto">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                  <Filter size={14} /> Search Criteria
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setChapter('')
                    setTopic('')
                    setType('')
                    setDifficulty('')
                    setMarks('')
                    setKeywords('')
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Reset Filters
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                <Select
                  label="Board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  options={BOARD_OPTIONS}
                />
                <Input
                  label="Class"
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  placeholder="e.g. Class 10"
                />
              </div>

              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science, Mathematics"
              />

              <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                <Input
                  label="Chapter"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g. Chemical Reactions"
                />
                <Input
                  label="Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Oxidation & Reduction"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Question Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={QUESTION_TYPE_OPTIONS}
                />
                <Select
                  label="Difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  options={DIFFICULTY_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Marks"
                  type="number"
                  min="1"
                  max="100"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="e.g. 2"
                />
                <Select
                  label="Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'Hindi', label: 'Hindi' },
                  ]}
                />
              </div>

              <Input
                label="Keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. photosynthesis, law of motion"
              />

              <label className="flex items-start gap-2 pt-1 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAI}
                  onChange={(e) => setIncludeAI(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Include AI Generated questions (Strictly aligned to permitted syllabus)</span>
              </label>

              <Button
                type="submit"
                loading={loading}
                leftIcon={Search}
                className="w-full shadow-xs"
              >
                Find Matching Questions
              </Button>
            </form>
          </div>

          {/* Right: Results List */}
          <div className="flex-1 overflow-y-auto p-5">
            {!hasSearched ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-500">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search size={28} />
                </div>
                <h3 className="text-base font-semibold text-slate-700">No Search Performed Yet</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  Enter your subject, class, chapter, and desired question criteria on the left, then click &quot;Find Matching Questions&quot;.
                </p>
              </div>
            ) : loading ? (
              <div className="flex h-full flex-col items-center justify-center p-12 text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-3" />
                <p className="text-sm font-medium text-slate-700">Searching open curriculum &amp; verified banks...</p>
                <p className="text-xs text-slate-400">Calculating relevance match scores and checking duplicates</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-500">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <HelpCircle size={28} />
                </div>
                <h3 className="text-base font-semibold text-slate-700">No Matching Questions Found</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  Try broadening your chapter, keywords, or removing specific mark filters to view more curriculum questions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    Showing <span className="text-indigo-600">{results.length}</span> verified matching questions
                  </p>
                  <span className="text-xs text-slate-400">
                    Mandatory teacher review required before exam inclusion
                  </span>
                </div>

                {results.map((q, idx) => {
                  const matchScore = q.matchScore ?? 85
                  const scoreColor =
                    matchScore >= 90
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : matchScore >= 75
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'

                  const sourceLabel =
                    q.source === 'OPEN_EDUCATIONAL_RESOURCE'
                      ? q.sourceName || 'NCERT OER'
                      : q.source === 'SCHOOL_BANK'
                      ? 'School Bank'
                      : q.source === 'AI_GENERATED'
                      ? 'AI Generated'
                      : q.sourceName || 'External Bank'

                  const sourceColor =
                    q.source === 'OPEN_EDUCATIONAL_RESOURCE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : q.source === 'SCHOOL_BANK'
                      ? 'bg-indigo-100 text-indigo-800'
                      : q.source === 'AI_GENERATED'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'

                  const isSaved = savedToBankIds.has(q.id || q.text)
                  const isAlreadyAdded = q.isAlreadyInExam

                  return (
                    <div
                      key={q.id || idx}
                      className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs transition hover:border-indigo-200 hover:shadow-sm"
                    >
                      {/* Top Bar: Match Score + Source Info + Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${scoreColor}`}
                          >
                            <Sparkles size={12} /> {matchScore}% Match
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${sourceColor}`}>
                            {sourceLabel}
                          </span>
                          {q.sourceUrl && (
                            <a
                              href={q.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600"
                              title="View Official Source"
                            >
                              <ExternalLink size={12} /> Source
                            </a>
                          )}
                          {q.license && (
                            <span className="text-[11px] text-slate-400">({q.license})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                            {q.type?.replace(/_/g, ' ') || 'QUESTION'}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                            {q.difficulty || 'MEDIUM'}
                          </span>
                          <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                            {q.marks || 1} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Duplicate Warning Banner if applicable */}
                      {q.isDuplicate && (
                        <div className="mt-3 flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                            <div>
                              <p className="font-semibold">Similar question already exists in your exam / bank</p>
                              <p className="text-[11px] text-amber-700">
                                Match similarity: {Math.round((q.duplicateMatch?.similarity || 0.85) * 100)}%
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenReview(q, true)}
                              className="rounded bg-amber-200/80 px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-300"
                            >
                              Edit Question
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Question Text */}
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.text}</p>

                        {/* Options if MCQ */}
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1.5 text-xs text-slate-700"
                              >
                                <span className="font-bold text-slate-400">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Metadata row */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {q.chapter && <span>Chapter: <strong className="text-slate-600">{q.chapter}</strong></span>}
                        {q.topic && <span>Topic: <strong className="text-slate-600">{q.topic}</strong></span>}
                        {q.subject && <span>Subject: <strong className="text-slate-600">{q.subject}</strong></span>}
                        {q.classGrade && <span>Class: <strong className="text-slate-600">{q.classGrade}</strong></span>}
                      </div>

                      {/* Card Action Buttons (Mandatory Teacher Review Gate) */}
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        {q.source !== 'SCHOOL_BANK' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            leftIcon={Bookmark}
                            disabled={isSaved}
                            onClick={() => handleSaveToBank(q)}
                          >
                            {isSaved ? 'Saved to Bank' : 'Save to Bank'}
                          </Button>
                        )}

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          leftIcon={Eye}
                          onClick={() => handleOpenReview(q)}
                        >
                          Review &amp; Edit
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          leftIcon={Plus}
                          disabled={isAlreadyAdded}
                          onClick={() => handleOpenReview(q)}
                        >
                          {isAlreadyAdded ? 'Already in Exam' : 'Approve & Add'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <span className="text-xs text-slate-500">
            All content strictly attributes source and respects open educational licensing guidelines.
          </span>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      {/* Teacher Review & Edit Sub-Modal (Mandatory Teacher Approval Gate) */}
      {reviewingQuestion && reviewDraft && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Teacher Review &amp; Approval
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReviewingQuestion(null)
                  setReviewDraft(null)
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-6 text-xs">
              <div className="rounded-lg bg-indigo-50/60 p-3 text-indigo-900">
                <p className="font-semibold">Review Requirement</p>
                <p className="text-indigo-700">
                  Review the question text, suggested answers, difficulty, and marking scheme before approving it into the examination.
                </p>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Question Text</label>
                <textarea
                  rows={3}
                  value={reviewDraft.text}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, text: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Select
                  label="Question Type"
                  value={reviewDraft.type}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, type: e.target.value }))}
                  options={QUESTION_TYPE_OPTIONS.filter((o) => o.value)}
                />
                <Select
                  label="Difficulty"
                  value={reviewDraft.difficulty}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, difficulty: e.target.value }))}
                  options={DIFFICULTY_OPTIONS.filter((o) => o.value)}
                />
                <Input
                  label="Marks"
                  type="number"
                  min="1"
                  max="100"
                  value={reviewDraft.marks}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, marks: Number(e.target.value) }))}
                />
              </div>

              {/* Options for MCQ */}
              {reviewDraft.type === 'MCQ' && (
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">Multiple Choice Options</label>
                  {(reviewDraft.options || []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 font-bold text-slate-500">{String.fromCharCode(65 + i)}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...reviewDraft.options]
                          newOpts[i] = e.target.value
                          setReviewDraft((p) => ({ ...p, options: newOpts }))
                        }}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Correct Answer / Answer Key</label>
                <input
                  type="text"
                  value={reviewDraft.correctAnswer || ''}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, correctAnswer: e.target.value }))}
                  placeholder="e.g. Option A or Chemical Formula"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Explanation / Model Solution</label>
                <textarea
                  rows={2}
                  value={reviewDraft.explanation || ''}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, explanation: e.target.value }))}
                  placeholder="Detailed scientific explanation or step-by-step solution"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Marking Scheme / Rubric</label>
                <textarea
                  rows={2}
                  value={reviewDraft.rubric || ''}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, rubric: e.target.value }))}
                  placeholder="e.g. 1 mark for correct definition, 1 mark for chemical equation"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Exam Section</label>
                <input
                  type="text"
                  value={reviewDraft.sectionName || 'Section A'}
                  onChange={(e) => setReviewDraft((p) => ({ ...p, sectionName: e.target.value }))}
                  placeholder="e.g. Section A, Section B"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewingQuestion(null)
                  setReviewDraft(null)
                }}
              >
                Cancel
              </Button>
              <Button
                leftIcon={CheckCircle2}
                onClick={() => handleApproveAndAdd(reviewDraft)}
              >
                Approve &amp; Add to Exam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
