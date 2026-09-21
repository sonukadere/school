import { useState, useEffect, useCallback } from 'react'
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  History,
  Users,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import { apiClient } from '../../services/apiClient'

export default function StudentPromotionPage() {
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState('promote') // 'promote' | 'history'
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Promotion form state
  const [fromClassId, setFromClassId] = useState('')
  const [toClassId, setToClassId] = useState('')
  const [fromSession, setFromSession] = useState('2025-2026')
  const [toSession, setToSession] = useState('2026-2027')
  const [actionType, setActionType] = useState('PROMOTED') // 'PROMOTED' | 'RETAINED' | 'GRADUATED'
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)

  // History state
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load Classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await (api.getClasses ? api.getClasses() : apiClient.get('/classes'))
        const list = Array.isArray(res) ? res : (res?.data || [])
        setClasses(list)
        if (list.length >= 2) {
          setFromClassId(list[0].id)
          setToClassId(list[1].id)
        } else if (list.length === 1) {
          setFromClassId(list[0].id)
        }
      } catch (err) {
        showToast('Failed to load classes', 'error')
      }
    }
    loadClasses()
  }, [showToast])

  // Load Students in Source Class
  const fetchClassStudents = useCallback(async (clsId) => {
    if (!clsId) {
      setStudents([])
      return
    }
    try {
      setLoadingStudents(true)
      const res = await api.getStudents({ classId: clsId, limit: 200 })
      const list = res?.data || []
      setStudents(list)
      // Select all by default
      setSelectedStudentIds(new Set(list.map((s) => s.id)))
    } catch (err) {
      showToast('Failed to fetch class students', 'error')
    } finally {
      setLoadingStudents(false)
    }
  }, [showToast])

  useEffect(() => {
    if (fromClassId) {
      fetchClassStudents(fromClassId)
    }
  }, [fromClassId, fetchClassStudents])

  // Load History
  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const res = await api.getPromotionHistory({ limit: 100 })
      setHistory(res?.data || [])
    } catch (err) {
      showToast('Failed to load promotion history', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }, [showToast])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab, fetchHistory])

  // Toggle selection
  const handleToggleStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)))
    }
  }

  // Handle Submit Promotion
  const handleExecutePromotion = async () => {
    if (selectedStudentIds.size === 0) {
      showToast('Please select at least one student to promote.', 'error')
      return
    }

    if (actionType === 'PROMOTED' && !toClassId) {
      showToast('Please select a target class for promotion.', 'error')
      return
    }

    if (actionType === 'PROMOTED' && fromClassId === toClassId) {
      showToast('Source class and target class cannot be the same for promotion.', 'error')
      return
    }

    const confirmMsg = `Are you sure you want to execute ${actionType.toLowerCase()} for ${selectedStudentIds.size} student(s) to session ${toSession}?`
    if (!window.confirm(confirmMsg)) return

    try {
      setSubmitting(true)
      const res = await api.promoteStudents({
        studentIds: Array.from(selectedStudentIds),
        fromClassId,
        toClassId: actionType === 'PROMOTED' ? toClassId : null,
        fromSession,
        toSession,
        status: actionType,
      })

      showToast(res.message || 'Promotion executed successfully!', 'success')
      fetchClassStudents(fromClassId)
    } catch (err) {
      showToast(err.message || 'Promotion failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const fromClassName = classes.find((c) => c.id === fromClassId)?.name || 'Selected Class'
  const toClassName = classes.find((c) => c.id === toClassId)?.name || 'Next Class'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Annual Promotion & Progression"
        description="Bulk promote batches of students to higher grades, manage session retention, or record graduation"
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('promote')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
            activeTab === 'promote'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap size={18} />
          Promotion Console
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History size={18} />
          Promotion Audit Logs
        </button>
      </div>

      {activeTab === 'promote' ? (
        <div className="space-y-6">
          {/* Configuration Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs text-indigo-600 font-bold">1</span>
              Configure Promotion Batch
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Class (From) *</label>
                <select
                  value={fromClassId}
                  onChange={(e) => setFromClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `(${cls.section})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action Type *</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="PROMOTED">Promote to Next Grade</option>
                  <option value="RETAINED">Retain in Same Grade</option>
                  <option value="GRADUATED">Mark as Graduated / Alumni</option>
                </select>
              </div>

              {actionType === 'PROMOTED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class (To) *</label>
                  <select
                    value={toClassId}
                    onChange={(e) => setToClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="">Select Next Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `(${cls.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Session</label>
                  <input
                    type="text"
                    value={fromSession}
                    onChange={(e) => setFromSession(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To Session</label>
                  <input
                    type="text"
                    value={toSession}
                    onChange={(e) => setToSession(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Visual Batch Flow Banner */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 px-3 py-1.5 font-bold text-indigo-700 text-sm">
                  {fromClassName} ({fromSession})
                </div>
                <ArrowRight size={20} className="text-slate-400" />
                <div className="rounded-lg bg-emerald-100 px-3 py-1.5 font-bold text-emerald-700 text-sm">
                  {actionType === 'PROMOTED' ? toClassName : actionType === 'RETAINED' ? `${fromClassName} (Repeat)` : 'Graduated'} ({toSession})
                </div>
              </div>

              <Button
                onClick={handleExecutePromotion}
                variant="success"
                loading={submitting}
                disabled={selectedStudentIds.size === 0}
              >
                Execute {actionType} ({selectedStudentIds.size} Students)
              </Button>
            </div>
          </div>

          {/* Student Selection Table */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {selectedStudentIds.size === students.length ? (
                    <CheckSquare size={18} className="text-indigo-600" />
                  ) : (
                    <Square size={18} className="text-slate-400" />
                  )}
                  Select All ({selectedStudentIds.size} / {students.length})
                </button>
              </div>

              <span className="text-xs text-slate-500">Uncheck any students who should not be promoted</span>
            </div>

            {loadingStudents ? (
              <div className="flex h-48 items-center justify-center">
                <Loader size="md" />
              </div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No active students found in {fromClassName}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3 w-10"></th>
                      <th className="px-5 py-3">Student ID</th>
                      <th className="px-5 py-3">Student Name</th>
                      <th className="px-5 py-3">Roll No.</th>
                      <th className="px-5 py-3">Gender</th>
                      <th className="px-5 py-3">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((stu) => {
                      const isSelected = selectedStudentIds.has(stu.id)
                      return (
                        <tr
                          key={stu.id}
                          onClick={() => handleToggleStudent(stu.id)}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-indigo-600" />
                            ) : (
                              <Square size={16} className="text-slate-300" />
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono font-bold text-xs text-indigo-600">
                            {stu.studentId}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {stu.fullName || `${stu.firstName} ${stu.lastName || ''}`}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-700">{stu.rollNumber || '-'}</td>
                          <td className="px-5 py-3.5 text-slate-600">{stu.gender}</td>
                          <td className="px-5 py-3.5">
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                              {stu.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Audit Logs */
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
          {loadingHistory ? (
            <div className="flex h-64 items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No historical promotion runs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Action</th>
                    <th className="px-5 py-3.5">Session Transition</th>
                    <th className="px-5 py-3.5">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {h.student?.firstName} {h.student?.lastName}
                        <span className="ml-2 font-mono text-xs text-indigo-600">({h.student?.studentId})</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                            h.status === 'PROMOTED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : h.status === 'GRADUATED'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-700">
                        {h.fromSession} &rarr; {h.toSession}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">{h.promotedBy?.name || 'Administrator'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
