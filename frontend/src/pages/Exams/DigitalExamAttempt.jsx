import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowRight,
  ArrowLeft,
  Send,
  HelpCircle,
  Award,
} from 'lucide-react'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Loader from '../../components/common/Loader'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function DigitalExamAttempt() {
  const { id: examId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Student Responses State: { [questionId]: answerString }
  const [answers, setAnswers] = useState({})
  const [flagged, setFlagged] = useState(new Set())
  const [lastSaved, setLastSaved] = useState('All changes saved')

  // Timer State
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const timerRef = useRef(null)

  // Submit Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultSummary, setResultSummary] = useState(null)

  // Initialize Exam Attempt
  useEffect(() => {
    async function initExam() {
      try {
        setLoading(true)
        // 1. Fetch exam paper
        const paper = await api.getExamPaper(examId)
        setExam(paper)

        // Flatten sections into flat questions array safely
        let allQ = []
        if (Array.isArray(paper?.sections)) {
          allQ = paper.sections.flatMap((s) => s.questions || [])
        } else if (paper?.sections && typeof paper.sections === 'object') {
          allQ = Object.values(paper.sections).flat().filter(Boolean)
        }
        setQuestions(allQ)

        // 2. Start or resume attempt
        const att = await api.startDigitalAttempt(examId)
        setAttempt(att)

        // Pre-fill existing answers if resuming
        if (att?.answers && typeof att.answers === 'object') {
          setAnswers(att.answers)
        }

        // Set duration
        const durationSecs = (paper.durationMinutes || 180) * 60
        setRemainingSeconds(durationSecs)
      } catch (err) {
        console.error('Failed to init digital exam:', err)
        showToast(err.message || 'Failed to start digital exam', 'error')
      } finally {
        setLoading(false)
      }
    }
    initExam()
  }, [examId, showToast])

  // Countdown timer
  useEffect(() => {
    if (remainingSeconds <= 0 || resultSummary) return

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [remainingSeconds, resultSummary])

  // Auto-save local answers feedback
  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
    setLastSaved('Saved')
  }

  const toggleFlag = (qId) => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  // Format timer seconds into HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleAutoSubmit = async () => {
    showToast('Time expired! Submitting your exam automatically...', 'info')
    await doSubmit()
  }

  const doSubmit = async () => {
    try {
      setSubmitting(true)
      const res = await api.submitDigitalAttempt(examId, answers)
      setResultSummary(res)
      setSubmitModalOpen(false)
      showToast('Exam submitted successfully!', 'success')
    } catch (err) {
      console.error('Submit failed:', err)
      showToast(err.message || 'Failed to submit exam', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader />

  // Completion Summary Screen
  if (resultSummary) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card className="text-center p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Exam Submitted Successfully!</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your responses for &quot;{exam?.name}&quot; have been safely recorded.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 text-center">
            <div>
              <p className="text-xs text-slate-500">Total Questions</p>
              <p className="mt-1 text-xl font-bold text-slate-800">{questions.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Answered</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {Object.keys(answers).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <Badge className="mt-1 bg-sky-100 text-sky-800">
                {resultSummary.status || 'SUBMITTED'}
              </Badge>
            </div>
          </div>

          {resultSummary.score !== undefined && resultSummary.score !== null && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Auto-Graded Objective Score
              </p>
              <p className="mt-1 text-3xl font-black">{resultSummary.score} Marks</p>
              <p className="text-xs text-emerald-600 mt-1">
                Subjective questions will be evaluated by your teacher.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button onClick={() => navigate('/exams')}>Return to Exams</Button>
          </div>
        </Card>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  if (!currentQ) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No questions found for this exam.</p>
        <Button className="mt-4" onClick={() => navigate('/exams')}>
          Back to Exams
        </Button>
      </div>
    )
  }

  const qKey = currentQ.id || `q_${currentIndex}`
  const currentAnswer = answers[qKey] || ''
  const isFlagged = flagged.has(qKey)

  // Stats for palette
  const answeredCount = Object.keys(answers).filter((k) => answers[k] && answers[k].trim() !== '').length

  return (
    <div className="space-y-4">
      {/* Top Floating Examination Header */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 px-6 py-3.5 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-slate-900">{exam?.name}</h2>
          <p className="text-xs text-slate-500">
            {exam?.className} • {exam?.subjectName || exam?.subject} • Total {exam?.totalMarks || 100} Marks
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">{lastSaved}</span>

          {/* Timer Clock */}
          <div
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-mono text-sm font-bold shadow-xs ${
              remainingSeconds < 300
                ? 'animate-pulse bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            <Clock size={16} />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <Button
            size="sm"
            leftIcon={Send}
            onClick={() => setSubmitModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Main Examination Workspace: Left Question Area + Right Question Palette */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Left / Main Question Area (3 Cols) */}
        <div className="lg:col-span-3">
          <Card className="min-h-[500px] flex flex-col justify-between">
            <div>
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                    Q{currentIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {currentQ.sectionName || 'Section A'}
                  </span>
                  <Badge className="bg-slate-100 text-slate-700">
                    {currentQ.type?.replace(/_/g, ' ') || 'SHORT ANSWER'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFlag(qKey)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      isFlagged
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Flag size={14} />
                    {isFlagged ? 'Marked for Review' : 'Mark for Review'}
                  </button>

                  <span className="font-bold text-indigo-700 text-xs">
                    [{currentQ.marks || 1} Mark{currentQ.marks > 1 ? 's' : ''}]
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="py-6">
                <p className="text-base font-semibold text-slate-900 leading-relaxed">
                  {currentQ.text}
                </p>

                {/* Question Input Controls: MCQ Options or Text Area */}
                {Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {currentQ.options.map((option, optIdx) => {
                      const optLabel = String.fromCharCode(65 + optIdx)
                      const isSelected = currentAnswer === option || currentAnswer === optLabel
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleAnswerChange(qKey, option)}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {optLabel}
                          </span>
                          <span className="font-medium text-slate-800">{option}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-6">
                    <label className="block mb-2 text-xs font-semibold text-slate-600 uppercase">
                      Your Answer:
                    </label>
                    <textarea
                      rows={6}
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(qKey, e.target.value)}
                      placeholder="Type your explanation or response clearly here..."
                      className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Question Navigation Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                leftIcon={ArrowLeft}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>

              <button
                type="button"
                onClick={() => handleAnswerChange(qKey, '')}
                className="text-xs text-slate-400 hover:text-rose-600"
              >
                Clear Response
              </button>

              <Button
                type="button"
                rightIcon={ArrowRight}
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
              >
                Next Question
              </Button>
            </div>
          </Card>
        </div>

        {/* Right / Question Palette (1 Col) */}
        <div>
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2.5">
              Question Palette
            </h3>

            {/* Legend */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-200" />
                <span>Unanswered ({questions.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-purple-500" />
                <span>Review ({flagged.size})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-indigo-600" />
                <span>Current</span>
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const k = q.id || `q_${idx}`
                const isAns = Boolean(answers[k] && answers[k].trim() !== '')
                const isFlg = flagged.has(k)
                const isCurr = idx === currentIndex

                let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                if (isAns) {
                  btnClass = 'bg-emerald-500 text-white hover:bg-emerald-600'
                }
                if (isFlg) {
                  btnClass = 'bg-purple-500 text-white hover:bg-purple-600'
                }
                if (isCurr) {
                  btnClass += ' ring-2 ring-indigo-600 ring-offset-2'
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                leftIcon={CheckCircle2}
                onClick={() => setSubmitModalOpen(true)}
              >
                Submit Exam
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal Before Submission */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Confirm Exam Submission</h3>
            <p className="mt-1 text-xs text-slate-500">
              Please review your summary before finalizing your exam.
            </p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <strong className="text-slate-900">{questions.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Answered Questions:</span>
                <strong className="text-emerald-600">{answeredCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Unanswered Questions:</span>
                <strong className="text-rose-600">{questions.length - answeredCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <strong className="text-purple-600">{flagged.size}</strong>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => setSubmitModalOpen(false)}
              >
                Continue Exam
              </Button>
              <Button
                loading={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={doSubmit}
              >
                Confirm &amp; Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
