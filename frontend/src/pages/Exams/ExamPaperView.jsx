import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Printer,
  ArrowLeft,
  FileText,
  Key,
  Award,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Loader from '../../components/common/Loader'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/helpers'

export default function ExamPaperView() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('paper') // 'paper' | 'answer-key'

  useEffect(() => {
    async function loadPaper() {
      try {
        setLoading(true)
        const data = await api.getExamPaper(id)
        setExam(data)
      } catch (err) {
        console.error('Failed to load exam paper:', err)
        showToast(err.message || 'Failed to load exam paper', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadPaper()
  }, [id, showToast])

  const handlePrint = () => {
    window.print()
  }

  const sections = useMemo(() => {
    if (!exam?.sections) return []
    if (Array.isArray(exam.sections)) {
      return exam.sections.map((sec) => ({
        sectionName: sec.sectionName || 'General Section',
        questions: Array.isArray(sec.questions) ? sec.questions : [],
      }))
    }
    if (typeof exam.sections === 'object') {
      return Object.entries(exam.sections).map(([sectionName, questions]) => ({
        sectionName,
        questions: Array.isArray(questions) ? questions : [],
      }))
    }
    return []
  }, [exam?.sections])

  if (loading) {
    return <Loader />
  }

  if (!exam) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800">Exam Paper Not Found</h2>
        <Link to="/exams" className="mt-4 inline-block text-indigo-600 hover:underline">
          Return to Exams
        </Link>
      </div>
    )
  }

  const canViewAnswerKey = (user?.role || '').toUpperCase() !== 'STUDENT'

  return (
    <div className="space-y-6">
      {/* Screen-only Controls (Hidden during print) */}
      <div className="print:hidden">
        <PageHeader
          title={`${exam.name} — Paper & Marking Scheme`}
          description={`${exam.className || ''} • ${exam.subjectName || exam.subject || ''} • ${exam.totalMarks || 100} Marks`}
          breadcrumb={[
            { label: 'Exams', href: '/exams' },
            { label: 'Exam Paper' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link to="/exams">
                <Button variant="outline" leftIcon={ArrowLeft}>
                  Back to Exams
                </Button>
              </Link>
              <Button leftIcon={Printer} onClick={handlePrint}>
                Print Question Paper
              </Button>
            </div>
          }
        />

        {/* Tab Navigation */}
        <div className="flex flex-wrap sm:flex-nowrap border-b border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('paper')}
            className={`flex items-center gap-2 border-b-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'paper'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={16} />
            Question Paper (Student View / Printable)
          </button>

          {canViewAnswerKey && (
            <button
              type="button"
              onClick={() => setActiveTab('answer-key')}
              className={`flex items-center gap-2 border-b-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'answer-key'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Key size={16} />
              Answer Key &amp; Marking Rubric (Faculty Only)
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Official Question Paper (Designed for screen & standard A4 print) */}
      {activeTab === 'paper' && (
        <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-4 sm:p-8 shadow-xs print:m-0 print:max-w-none print:border-none print:p-0 print:shadow-none">
          {/* Official Institution Header */}
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <h1 className="text-xl font-black tracking-wider text-slate-900 uppercase sm:text-2xl">
              DAILY DAY ACADEMY
            </h1>
            <p className="text-xs font-medium tracking-wide text-slate-600 uppercase">
              Affiliated to {exam.board || 'CBSE'} • School Examination Board
            </p>
            <h2 className="mt-2 text-base font-bold text-slate-800 uppercase sm:text-lg">
              {exam.name}
            </h2>

            {/* Exam Meta Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-300 pt-2 text-xs font-semibold text-slate-700">
              <div>
                <span>Class: </span>
                <strong className="text-slate-900">{exam.className || 'General'}</strong>
              </div>
              <div>
                <span>Subject: </span>
                <strong className="text-slate-900">{exam.subjectName || exam.subject || 'All Subjects'}</strong>
              </div>
              <div>
                <span>Time Allowed: </span>
                <strong className="text-slate-900">
                  {Math.floor((exam.durationMinutes || 180) / 60)} Hours {((exam.durationMinutes || 180) % 60) > 0 ? `${(exam.durationMinutes || 180) % 60} Mins` : ''}
                </strong>
              </div>
              <div>
                <span>Maximum Marks: </span>
                <strong className="text-slate-900">{exam.totalMarks || 100}</strong>
              </div>
            </div>
          </div>

          {/* Student Roll / Name filling block for printed sheets */}
          <div className="mt-3 hidden justify-between border-b border-dashed border-slate-400 pb-2 text-xs text-slate-600 print:flex">
            <span>Student Name: _________________________________________</span>
            <span>Roll No: _________________</span>
            <span>Date: {formatDate(exam.startDate || exam.date)}</span>
          </div>

          {/* General Instructions */}
          {exam.instructions && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3.5 text-xs text-slate-700 print:bg-transparent print:p-0 print:pt-2">
              <strong className="block font-bold text-slate-900 uppercase">General Instructions:</strong>
              <div className="mt-1 whitespace-pre-line leading-relaxed text-slate-600">
                {exam.instructions}
              </div>
            </div>
          )}

          {/* Question Sections */}
          <div className="mt-6 space-y-8">
            {sections.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-8">
                No questions have been attached to this exam paper.
              </p>
            ) : (
              sections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-4">
                  {/* Section Title */}
                  <div className="border-b border-slate-200 pb-1 text-center">
                    <h3 className="inline-block border-b-2 border-indigo-600 px-4 pb-1 text-sm font-bold tracking-wide text-slate-800 uppercase print:border-black">
                      {sec.sectionName}
                    </h3>
                  </div>

                  {/* Section Questions */}
                  <div className="space-y-4">
                    {sec.questions.map((q) => (
                      <div key={q.id || q.order} className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-slate-900">Q{q.order}.</span>
                            <div className="text-sm text-slate-800 leading-relaxed">
                              {q.text}

                              {/* Multiple Choice Options */}
                              {Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="mt-2.5 grid grid-cols-1 gap-2 pl-2 sm:grid-cols-2">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2 text-xs text-slate-700">
                                      <span className="font-bold text-slate-900">
                                        ({String.fromCharCode(65 + optIdx)})
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Marks aligned to right margin */}
                        <div className="shrink-0 text-right">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            [{q.marks}]
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* End of paper indicator */}
          <div className="mt-12 border-t border-slate-300 pt-4 text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
            *** END OF EXAMINATION PAPER ***
          </div>
        </div>
      )}

      {/* Tab 2: Answer Key & Marking Scheme (Faculty Only) */}
      {activeTab === 'answer-key' && canViewAnswerKey && (
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Faculty Marking Scheme &amp; Answer Key</h3>
                <p className="text-xs text-slate-500">Official model answers and rubric breakdown for grading</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 font-semibold">
                Faculty Confidential
              </Badge>
            </div>

            <div className="mt-4 space-y-6">
              {sections.flatMap((sec) => sec.questions).map((q) => (
                <div
                  key={q.id || q.order}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700">
                      Question {q.order} ({q.sectionName || 'Section A'})
                    </span>
                    <span className="rounded bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800">
                      {q.marks} Mark{q.marks > 1 ? 's' : ''}
                    </span>
                  </div>

                  <p className="font-medium text-slate-800">{q.text}</p>

                  {/* Correct Answer */}
                  {q.correctAnswer ? (
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-900">
                      <strong className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Model Answer / Key:
                      </strong>
                      <p className="mt-0.5 font-semibold">{q.correctAnswer}</p>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">No exact answer key provided.</div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="rounded-lg bg-blue-50/60 p-2.5 text-blue-900">
                      <strong className="block text-[11px] font-bold uppercase tracking-wider text-blue-700">
                        Explanation:
                      </strong>
                      <p className="mt-0.5 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}

                  {/* Marking Rubric */}
                  {q.rubric && (
                    <div className="rounded-lg bg-amber-50/60 p-2.5 text-amber-900">
                      <strong className="block text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        Marking Rubric:
                      </strong>
                      <p className="mt-0.5 leading-relaxed">{q.rubric}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
