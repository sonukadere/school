import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  User,
  School,
  Paperclip,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api, { api as namedApi } from '../../services/api'
import { apiClient } from '../../services/apiClient'

const getHomeworkListFn = async (params) => {
  if (typeof api?.getHomeworkList === 'function') return api.getHomeworkList(params)
  if (typeof namedApi?.getHomeworkList === 'function') return namedApi.getHomeworkList(params)
  const res = await apiClient.get('/homework', params)
  return {
    data: Array.isArray(res) ? res : (res?.data || []),
    pagination: res?.pagination || null,
  }
}

const createHomeworkFn = async (data) => {
  if (typeof api?.createHomework === 'function') return api.createHomework(data)
  if (typeof namedApi?.createHomework === 'function') return namedApi.createHomework(data)
  const res = await apiClient.post('/homework', data)
  return res?.data || res
}

const deleteHomeworkFn = async (id) => {
  if (typeof api?.deleteHomework === 'function') return api.deleteHomework(id)
  if (typeof namedApi?.deleteHomework === 'function') return namedApi.deleteHomework(id)
  return apiClient.delete(`/homework/${id}`)
}

export default function HomeworkList() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [homeworkList, setHomeworkList] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    title: '',
    description: '',
    attachment: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  })
  const [submitting, setSubmitting] = useState(false)

  const canManage = user?.isAdmin || user?.isSuperAdmin || user?.isTeacher

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [hwRes, clsRes, subRes] = await Promise.all([
        getHomeworkListFn({
          classId: selectedClassId || undefined,
          subjectId: selectedSubjectId || undefined,
          limit: 100,
        }),
        api.getClasses ? api.getClasses() : Promise.resolve([]),
        api.getSubjects ? api.getSubjects() : Promise.resolve([]),
      ])

      setHomeworkList(hwRes?.data || [])
      setClasses(Array.isArray(clsRes) ? clsRes : (clsRes?.data || []))
      setSubjects(Array.isArray(subRes) ? subRes : (subRes?.data || []))
    } catch (err) {
      showToast(err.message || 'Failed to load homework', 'error')
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
      setSubmitting(true)
      await createHomeworkFn(formData)
      showToast('Homework assigned successfully!', 'success')
      setModalOpen(false)
      setFormData({
        classId: classes[0]?.id || '',
        subjectId: subjects[0]?.id || '',
        title: '',
        description: '',
        attachment: '',
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      })
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to assign homework', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this homework?')) return
    try {
      await deleteHomeworkFn(id)
      showToast('Homework removed', 'success')
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to delete homework', 'error')
    }
  }

  const filteredHomework = homeworkList.filter((hw) => {
    if (!searchQuery) return true
    return (
      hw.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework & Daily Tasks"
        description="Track daily academic coursework assignments, instructions, and due dates"
        action={
          canManage && (
            <Button
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  classId: classes[0]?.id || '',
                  subjectId: subjects[0]?.id || '',
                }))
                setModalOpen(true)
              }}
              icon={Plus}
            >
              Assign Homework
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
              placeholder="Search homework tasks..."
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

      {/* Homework Cards Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : filteredHomework.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No Homework Assigned</h3>
          <p className="mt-1 text-xs text-slate-400">All caught up! Check back later or adjust filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHomework.map((hw) => {
            const isDueSoon = new Date(hw.dueDate) - new Date() < 86400000 * 2 && new Date(hw.dueDate) >= new Date()
            const isOverdue = new Date(hw.dueDate) < new Date()

            return (
              <div
                key={hw.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600">
                      {hw.subject?.name || 'Subject'}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {hw.class?.name} {hw.class?.section ? `(${hw.class.section})` : ''}
                    </span>
                  </div>

                  <h4 className="mt-3 text-base font-bold text-slate-800 line-clamp-2">{hw.title}</h4>
                  {hw.description && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {hw.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={14} className={isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : 'text-slate-400'} />
                      <span className={isOverdue ? 'font-bold text-red-600' : isDueSoon ? 'font-bold text-amber-600' : 'text-slate-600'}>
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => handleDelete(hw.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Homework"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Teacher: {hw.teacher?.name || 'Class Teacher'}</span>
                    {hw.attachment && (
                      <a
                        href={hw.attachment}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                      >
                        <Paperclip size={12} /> Attachment
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Assign Homework Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Assign Homework</h3>
                <p className="text-xs text-slate-500">Post daily homework tasks for your students</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
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
                label="Homework Title / Topic *"
                placeholder="e.g. Chapter 4 - Exercise 4.2 Questions 1 to 5"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <Input
                label="Submission Due Date *"
                type="date"
                icon={Calendar}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Instructions</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide step-by-step instructions or reference textbook page numbers..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <Input
                label="Reference Document / Worksheet URL (Optional)"
                placeholder="https://drive.google.com/... or /uploads/hw.pdf"
                icon={Paperclip}
                value={formData.attachment}
                onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button type="submit" loading={submitting}>
                  Post Homework
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
