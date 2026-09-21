import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Plus,
  Download,
  ExternalLink,
  Trash2,
  Search,
  Filter,
  Video,
  FileCode,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  BookOpen,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api, { api as namedApi } from '../../services/api'
import { apiClient } from '../../services/apiClient'

const getStudyMaterialsListFn = async (params) => {
  if (typeof api?.getStudyMaterialsList === 'function') return api.getStudyMaterialsList(params)
  if (typeof namedApi?.getStudyMaterialsList === 'function') return namedApi.getStudyMaterialsList(params)
  const res = await apiClient.get('/study-materials', params)
  return {
    data: Array.isArray(res) ? res : (res?.data || []),
    pagination: res?.pagination || null,
  }
}

const createStudyMaterialFn = async (data) => {
  if (typeof api?.createStudyMaterial === 'function') return api.createStudyMaterial(data)
  if (typeof namedApi?.createStudyMaterial === 'function') return namedApi.createStudyMaterial(data)
  const res = await apiClient.post('/study-materials', data)
  return res?.data || res
}

const deleteStudyMaterialFn = async (id) => {
  if (typeof api?.deleteStudyMaterial === 'function') return api.deleteStudyMaterial(id)
  if (typeof namedApi?.deleteStudyMaterial === 'function') return namedApi.deleteStudyMaterial(id)
  return apiClient.delete(`/study-materials/${id}`)
}

const FILE_TYPE_ICONS = {
  PDF: { icon: FileText, color: 'text-red-500 bg-red-50' },
  DOC: { icon: FileCode, color: 'text-blue-500 bg-blue-50' },
  IMAGE: { icon: ImageIcon, color: 'text-emerald-500 bg-emerald-50' },
  VIDEO: { icon: Video, color: 'text-purple-500 bg-purple-50' },
  LINK: { icon: LinkIcon, color: 'text-indigo-500 bg-indigo-50' },
  OTHER: { icon: FileText, color: 'text-slate-500 bg-slate-50' },
}

export default function StudyMaterialList() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedFileType, setSelectedFileType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Upload Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    title: '',
    description: '',
    fileType: 'PDF',
    fileUrl: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const canManage = user?.isAdmin || user?.isSuperAdmin || user?.isTeacher

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [matRes, clsRes, subRes] = await Promise.all([
        getStudyMaterialsListFn({
          classId: selectedClassId || undefined,
          subjectId: selectedSubjectId || undefined,
          fileType: selectedFileType || undefined,
          limit: 100,
        }),
        api.getClasses ? api.getClasses() : Promise.resolve([]),
        api.getSubjects ? api.getSubjects() : Promise.resolve([]),
      ])

      setMaterials(matRes?.data || [])
      setClasses(Array.isArray(clsRes) ? clsRes : (clsRes?.data || []))
      setSubjects(Array.isArray(subRes) ? subRes : (subRes?.data || []))
    } catch (err) {
      showToast(err.message || 'Failed to load study materials', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedClassId, selectedSubjectId, selectedFileType, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.classId || !formData.subjectId || !formData.title.trim() || !formData.fileUrl.trim()) {
      showToast('Please fill all required fields', 'error')
      return
    }

    try {
      setSubmitting(true)
      await createStudyMaterialFn(formData)
      showToast('Study material published successfully!', 'success')
      setModalOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to upload material', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return
    try {
      await deleteStudyMaterialFn(id)
      showToast('Study material removed', 'success')
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to remove material', 'error')
    }
  }

  const filteredMaterials = materials.filter((m) => {
    if (!searchQuery) return true
    return (
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials & Notes"
        description="Curated digital textbooks, syllabus notes, video lectures, and revision guides"
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
              Upload Material
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
              placeholder="Search by chapter, topic, or subject..."
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
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="">All Formats</option>
            <option value="PDF">PDF Documents</option>
            <option value="VIDEO">Video Lessons</option>
            <option value="DOC">Word / Notes</option>
            <option value="LINK">External Links</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No Study Materials Found</h3>
          <p className="mt-1 text-xs text-slate-400">Materials uploaded by teachers will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => {
            const typeConf = FILE_TYPE_ICONS[mat.fileType] || FILE_TYPE_ICONS.OTHER
            const Icon = typeConf.icon

            return (
              <div
                key={mat.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeConf.color}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {mat.subject?.name || 'Subject'}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{mat.class?.name}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {mat.fileType}
                    </span>
                  </div>

                  <h4 className="mt-3 text-base font-bold text-slate-800 line-clamp-2">{mat.title}</h4>
                  {mat.description && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {mat.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">By: {mat.teacher?.name || 'Teacher'}</span>

                  <div className="flex items-center gap-2">
                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition"
                    >
                      <ExternalLink size={14} /> Open Resource
                    </a>

                    {canManage && (
                      <button
                        onClick={() => handleDelete(mat.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Material"
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

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Upload Study Material</h3>
                <p className="text-xs text-slate-500">Share reference material and lectures with class</p>
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
                label="Resource Title *"
                placeholder="e.g. NCERT Chapter 5 Summary & Formula Sheet"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Type</label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="VIDEO">Video Lesson / YouTube URL</option>
                    <option value="DOC">Word Document / Notes</option>
                    <option value="IMAGE">Diagram / Image</option>
                    <option value="LINK">Web Link / Article</option>
                  </select>
                </div>

                <Input
                  label="Document / Video URL *"
                  placeholder="https://drive.google.com/... or https://youtu.be/..."
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Description / Notes</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the topics covered in this resource..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button type="submit" loading={submitting}>
                  Upload Material
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
