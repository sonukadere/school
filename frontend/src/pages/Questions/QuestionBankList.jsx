import { useState, useEffect } from 'react'
import {
  BookOpen,
  Sparkles,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Bookmark,
  ExternalLink,
  Award,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import QuestionDiscoveryModal from '../../components/exams/QuestionDiscoveryModal'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

export default function QuestionBankList() {
  const { showToast } = useToast()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Modals
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await api.getQuestions()
      setQuestions(data || [])
    } catch (err) {
      console.error('Failed to load questions:', err)
      showToast(err.message || 'Failed to load question bank', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await api.deleteQuestion(deleteTarget.id)
      showToast('Question removed from Question Bank', 'success')
      setDeleteTarget(null)
      loadQuestions()
    } catch (err) {
      showToast(err.message || 'Failed to delete question', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveQuestion = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editingQuestion.id) {
        await api.updateQuestion(editingQuestion.id, editingQuestion)
        showToast('Question updated successfully', 'success')
      } else {
        await api.addQuestion(editingQuestion)
        showToast('Question added to Question Bank', 'success')
      }
      setEditModalOpen(false)
      setEditingQuestion(null)
      loadQuestions()
    } catch (err) {
      showToast(err.message || 'Failed to save question', 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'text',
      header: 'Question',
      searchValue: (item) => `${item.text} ${item.subject} ${item.classGrade} ${item.chapter || ''}`,
      render: (item) => (
        <div className="max-w-md">
          <p className="font-medium text-slate-900 line-clamp-2">{item.text}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            {item.chapter && <span>Chapter: {item.chapter}</span>}
            {item.topic && <span>• Topic: {item.topic}</span>}
            {item.sourceName && <span>• Source: {item.sourceName}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Class',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.subject}</p>
          <p className="text-xs text-slate-500">{item.classGrade}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type & Difficulty',
      render: (item) => (
        <div className="flex flex-col gap-1">
          <Badge className="bg-slate-100 text-slate-700">
            {item.type?.replace(/_/g, ' ') || 'QUESTION'}
          </Badge>
          <span className="text-[11px] font-medium text-slate-500">
            {item.difficulty || 'MEDIUM'}
          </span>
        </div>
      ),
    },
    {
      key: 'marks',
      header: 'Marks',
      render: (item) => (
        <span className="font-bold text-indigo-700">
          {item.marks || 1} M
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Origin',
      render: (item) => (
        <Badge className={
          item.source === 'OPEN_EDUCATIONAL_RESOURCE'
            ? 'bg-emerald-100 text-emerald-800'
            : item.source === 'AI_GENERATED'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-indigo-100 text-indigo-800'
        }>
          {item.source === 'OPEN_EDUCATIONAL_RESOURCE' ? 'OER' : item.source === 'AI_GENERATED' ? 'AI' : 'School'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setEditingQuestion({ ...item })
              setEditModalOpen(true)
            }}
            title="Edit Question"
            className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
          >
            <Edit size={16} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(item)}
            title="Delete Question"
            className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Bank"
        description="Curated repository of syllabus-aligned questions, verified open educational resources, and assessment rubrics"
        breadcrumb={[{ label: 'Question Bank' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              leftIcon={Plus}
              onClick={() => {
                setEditingQuestion({
                  text: '',
                  type: 'MULTIPLE_CHOICE',
                  difficulty: 'MEDIUM',
                  marks: 2,
                  subject: 'Science',
                  classGrade: 'Class 10',
                  chapter: '',
                  topic: '',
                  board: 'CBSE',
                  correctAnswer: '',
                  explanation: '',
                  rubric: '',
                })
                setEditModalOpen(true)
              }}
            >
              Add Question
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={questions}
        loading={loading}
        pageSize={10}
        searchPlaceholder="Search questions by text, subject, class, or chapter..."
        emptyTitle="Question Bank is empty"
        emptyDescription="Click 'Add Question' to add new questions to the bank."
        emptyIcon={BookOpen}
      />

      {/* Discovery Modal */}
      <QuestionDiscoveryModal
        isOpen={isDiscoveryOpen}
        onClose={() => {
          setIsDiscoveryOpen(false)
          loadQuestions()
        }}
        onAddQuestionToExam={async (q) => {
          // Saving directly to question bank
          try {
            await api.addQuestion({
              text: q.text,
              type: q.type || 'SHORT_ANSWER',
              difficulty: q.difficulty || 'MEDIUM',
              marks: Number(q.marks) || 1,
              board: q.board || 'CBSE',
              classGrade: q.classGrade || 'Class 10',
              subject: q.subject || 'General',
              chapter: q.chapter || '',
              topic: q.topic || '',
              options: q.options || [],
              correctAnswer: q.correctAnswer || '',
              explanation: q.explanation || '',
              rubric: q.rubric || '',
              source: q.source || 'TEACHER_UPLOADED',
              sourceName: q.sourceName || 'Teacher Reviewed Question',
              sourceUrl: q.sourceUrl || '',
              license: q.license || 'Educational Use',
            })
            showToast('Question saved to Question Bank', 'success')
            loadQuestions()
          } catch (err) {
            showToast(err.message || 'Failed to save question', 'error')
          }
        }}
      />

      {/* Edit / Create Question Modal */}
      {editModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingQuestion.id ? 'Edit Question' : 'Create New Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-slate-700">Question Text</label>
                <textarea
                  rows={3}
                  required
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Enter complete question statement..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Subject"
                  required
                  value={editingQuestion.subject}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g. Science"
                />
                <Input
                  label="Class"
                  required
                  value={editingQuestion.classGrade}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, classGrade: e.target.value }))}
                  placeholder="e.g. Class 10"
                />
                <Input
                  label="Board"
                  value={editingQuestion.board || 'CBSE'}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, board: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Chapter"
                  value={editingQuestion.chapter || ''}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, chapter: e.target.value }))}
                  placeholder="e.g. Electricity"
                />
                <Input
                  label="Topic"
                  value={editingQuestion.topic || ''}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, topic: e.target.value }))}
                  placeholder="e.g. Ohm's Law"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Select
                  label="Question Type"
                  value={editingQuestion.type || 'SHORT_ANSWER'}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, type: e.target.value }))}
                  options={[
                    { value: 'MCQ', label: 'Multiple Choice' },
                    { value: 'SHORT_ANSWER', label: 'Short Answer' },
                    { value: 'LONG_ANSWER', label: 'Long Answer' },
                    { value: 'NUMERICAL', label: 'Numerical' },
                    { value: 'TRUE_FALSE', label: 'True / False' },
                  ]}
                />
                <Select
                  label="Difficulty"
                  value={editingQuestion.difficulty || 'MEDIUM'}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, difficulty: e.target.value }))}
                  options={[
                    { value: 'EASY', label: 'Easy' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HARD', label: 'Hard' },
                  ]}
                />
                <Input
                  label="Marks"
                  type="number"
                  min="1"
                  max="100"
                  value={editingQuestion.marks || 1}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, marks: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Correct Answer</label>
                <input
                  type="text"
                  value={editingQuestion.correctAnswer || ''}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, correctAnswer: e.target.value }))}
                  placeholder="Correct answer or solution..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Marking Rubric</label>
                <textarea
                  rows={2}
                  value={editingQuestion.rubric || ''}
                  onChange={(e) => setEditingQuestion((p) => ({ ...p, rubric: e.target.value }))}
                  placeholder="Grading breakdown..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditModalOpen(false)
                    setEditingQuestion(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Question"
        message={`Are you sure you want to remove this question from the Question Bank?`}
      />
    </div>
  )
}
