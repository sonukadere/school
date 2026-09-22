import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList,
  Plus,
  Calendar,
  Clock,
  User,
  School,
  Paperclip,
  Trash2,
  Search,
  Upload,
  CheckCircle2,
  Eye,
  Award,
  X,
  MessageSquare,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import { apiClient } from '../../services/apiClient'

const getAssignmentsListFn = async (params) => {
  if (typeof api?.getAssignmentsList === 'function') return api.getAssignmentsList(params)
  const res = await apiClient.get('/assignments', params)
  return {
    data: Array.isArray(res) ? res : (res?.data || []),
    pagination: res?.pagination || null,
  }
}

const createAssignmentFn = async (data) => {
  if (typeof api?.createAssignment === 'function') return api.createAssignment(data)
  const res = await apiClient.post('/assignments', data)
  return res?.data || res
}

const deleteAssignmentFn = async (id) => {
  if (typeof api?.deleteAssignment === 'function') return api.deleteAssignment(id)
  return apiClient.delete(`/assignments/${id}`)
}

const submitAssignmentFn = async (id, data) => {
  if (typeof api?.submitAssignment === 'function') return api.submitAssignment(id, data)
  const res = await apiClient.post(`/assignments/${id}/submissions`, data)
  return res?.data || res
}

export default function AssignmentList() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Create Assignment Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    title: '',
    description: '',
    attachment: '',
    maxMarks: 100,
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
  })
  const [creating, setCreating] = useState(false)

  // Student Submit Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [activeAssignment, setActiveAssignment] = useState(null)
  const [submissionFileUrl, setSubmissionFileUrl] = useState('')
  const [submissionRemarks, setSubmissionRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Submissions View Modal (For Teachers/Admins)
  const [viewSubmissionsOpen, setViewSubmissionsOpen] = useState(false)
  const [currentAssignmentDetails, setCurrentAssignmentDetails] = useState(null)
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null)
  const [gradeMarks, setGradeMarks] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')

  const isTeacherOrAdmin = user?.isAdmin || user?.isSuperAdmin || user?.isTeacher
  const isStudent = user?.isStudent || user?.role === 'Student'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [assignRes, clsRes, subRes] = await Promise.all([
        getAssignmentsListFn({
          classId: selectedClassId || undefined,
          subjectId: selectedSubjectId || undefined,
          limit: 100,
        }),
        isTeacherOrAdmin && api.getClasses ? api.getClasses() : Promise.resolve([]),
        isTeacherOrAdmin && api.getSubjects ? api.getSubjects() : Promise.resolve([]),
      ])

      setAssignments(assignRes?.data || [])
      setClasses(Array.isArray(clsRes) ? clsRes : (clsRes?.data || []))
      setSubjects(Array.isArray(subRes) ? subRes : (subRes?.data || []))
    } catch (err) {
      showToast(err.message || 'Failed to load assignments', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedClassId, selectedSubjectId, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.classId || !formData.subjectId || !formData.title.trim()) {
      showToast('Please fill all required fields', 'error')
      return
    }

    try {
      setCreating(true)
      await createAssignmentFn(formData)
      showToast('Assignment created successfully!', 'success')
      setCreateModalOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to create assignment', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return
    try {
      await deleteAssignmentFn(id)
      showToast('Assignment removed', 'success')
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to delete assignment', 'error')
    }
  }

  // Student submits work
  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await submitAssignmentFn(activeAssignment.id, {
        fileUrl: submissionFileUrl.trim(),
        remarks: submissionRemarks.trim(),
      })
      showToast('Assignment submitted successfully!', 'success')
      setSubmitModalOpen(false)
      setSubmissionFileUrl('')
      setSubmissionRemarks('')
      fetchData()
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Open teacher view of submissions
  const handleOpenSubmissions = async (assignment) => {
    try {
      const details = await apiClient.get(`/assignments/${assignment.id}`)
      setCurrentAssignmentDetails(details?.data || details)
      setViewSubmissionsOpen(true)
    } catch (err) {
      showToast('Failed to fetch submissions', 'error')
    }
  }

  // Teacher grades a student's submission
  const handleSaveGrade = async (assignmentId, submissionId) => {
    try {
      await apiClient.patch(`/assignments/${assignmentId}/submissions/${submissionId}`, {
        marks: Number(gradeMarks),
        feedback: gradeFeedback.trim(),
        status: 'GRADED',
      })
      showToast('Marks awarded successfully!', 'success')
      setGradingSubmissionId(null)
      // refresh details
      const details = await apiClient.get(`/assignments/${assignmentId}`)
      setCurrentAssignmentDetails(details?.data || details)
    } catch (err) {
      showToast(err.message || 'Grading failed', 'error')
    }
  }

  const filteredAssignments = assignments.filter((a) => {
    if (!searchQuery) return true
    return (
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments & Coursework"
        description="Formal graded projects, homework rubrics, and online student assignment submissions"
        action={
          isTeacherOrAdmin && (
            <Button
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  classId: classes[0]?.id || '',
                  subjectId: subjects[0]?.id || '',
                }))
                setCreateModalOpen(true)
              }}
              icon={Plus}
            >
              Create Assignment
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.section ? `(${cls.section})` : ''}
              </option>
            ))}
          </select>

          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No Assignments Found</h3>
          <p className="mt-1 text-xs text-slate-400">No active assignment projects created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assign) => {
            const isDueSoon = new Date(assign.dueDate) - new Date() < 86400000 * 2 && new Date(assign.dueDate) >= new Date()
            const isOverdue = new Date(assign.dueDate) < new Date()

            return (
              <div
                key={assign.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                      {assign.subject?.name || 'Subject'}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Max: {assign.maxMarks} Marks
                    </span>
                  </div>

                  <h4 className="mt-3 text-base font-bold text-slate-800 line-clamp-2">{assign.title}</h4>
                  {assign.description && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {assign.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={14} className={isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : 'text-slate-400'} />
                      <span className={isOverdue ? 'font-bold text-red-600' : isDueSoon ? 'font-bold text-amber-600' : 'text-slate-600'}>
                        Due: {new Date(assign.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500">
                      Submissions: {assign._count?.submissions ?? 0}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                    {isTeacherOrAdmin && (
                      <button
                        onClick={() => handleOpenSubmissions(assign)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        <Eye size={14} /> Review ({assign._count?.submissions ?? 0})
                      </button>
                    )}

                    {isStudent && (
                      <button
                        onClick={() => {
                          setActiveAssignment(assign)
                          setSubmitModalOpen(true)
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition"
                      >
                        <Upload size={14} /> Submit Work
                      </button>
                    )}

                    {isTeacherOrAdmin && (
                      <button
                        onClick={() => handleDelete(assign.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition ml-auto"
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Create New Assignment</h3>
                <p className="text-xs text-slate-500">Publish coursework project with rubrics</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `(${cls.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Assignment Title *"
                placeholder="e.g. Science Project: Solar Energy Working Model"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Due Date *"
                  type="date"
                  icon={Calendar}
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
                <Input
                  label="Maximum Marks"
                  type="number"
                  min="1"
                  max="1000"
                  icon={Award}
                  value={formData.maxMarks}
                  onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions & Guidelines</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail project specifications, presentation criteria, format requirements..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <Input
                label="Assignment Document / Rubric URL (Optional)"
                placeholder="https://... or /docs/rubric.pdf"
                icon={Paperclip}
                value={formData.attachment}
                onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button type="submit" loading={creating}>
                  Publish Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submit Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Submit Your Work</h3>
                <p className="text-xs text-slate-500">{activeAssignment?.title}</p>
              </div>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4">
              <Input
                label="Work Document / Google Drive Link *"
                placeholder="https://drive.google.com/..."
                icon={Paperclip}
                value={submissionFileUrl}
                onChange={(e) => setSubmissionFileUrl(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={submissionRemarks}
                  onChange={(e) => setSubmissionRemarks(e.target.value)}
                  placeholder="Any comments or explanations for your teacher..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button type="submit" loading={submitting}>
                  Confirm Submission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submissions Modal (Teacher) */}
      {viewSubmissionsOpen && currentAssignmentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Student Submissions: {currentAssignmentDetails.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Submissions: {currentAssignmentDetails.submissions?.length || 0} • Max Marks: {currentAssignmentDetails.maxMarks}
                </p>
              </div>
              <button
                onClick={() => setViewSubmissionsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentAssignmentDetails.submissions?.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No students have submitted this assignment yet.
                </div>
              ) : (
                currentAssignmentDetails.submissions?.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">
                          {sub.student?.firstName} {sub.student?.lastName} ({sub.student?.studentId})
                        </h5>
                        <p className="text-xs text-slate-500">
                          Submitted on {new Date(sub.submittedAt).toLocaleString()} • Status: <span className="font-semibold text-indigo-600">{sub.status}</span>
                        </p>
                      </div>

                      {sub.marks !== null && sub.marks !== undefined ? (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-center">
                          <span className="text-xs font-bold text-emerald-700">
                            {sub.marks} / {currentAssignmentDetails.maxMarks}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setGradingSubmissionId(sub.id)
                            setGradeMarks('')
                            setGradeFeedback('')
                          }}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
                        >
                          Grade Work
                        </button>
                      )}
                    </div>

                    {sub.fileUrl && (
                      <div className="text-xs">
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                        >
                          <Paperclip size={13} /> View Submitted Document / Link
                        </a>
                      </div>
                    )}

                    {sub.remarks && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                        "{sub.remarks}"
                      </p>
                    )}

                    {/* Grading Form Inline */}
                    {gradingSubmissionId === sub.id && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-100 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Award Marks *"
                            type="number"
                            min="0"
                            max={currentAssignmentDetails.maxMarks}
                            value={gradeMarks}
                            onChange={(e) => setGradeMarks(e.target.value)}
                            required
                          />
                          <Input
                            label="Teacher Feedback"
                            placeholder="e.g. Well researched, neat diagram."
                            value={gradeFeedback}
                            onChange={(e) => setGradeFeedback(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setGradingSubmissionId(null)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveGrade(currentAssignmentDetails.id, sub.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          >
                            Save Score
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
