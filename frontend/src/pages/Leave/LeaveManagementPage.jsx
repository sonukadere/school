import { useState, useEffect, useCallback } from 'react'
import {
  CalendarCheck,
  Plus,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Check,
  X,
  FileText,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api, { api as namedApi } from '../../services/api'
import { apiClient } from '../../services/apiClient'

// Resilient API resolution that ensures methods are always callable functions
const getLeaveRequestsFn = async (params) => {
  if (typeof api?.getLeaveRequests === 'function') return api.getLeaveRequests(params)
  if (typeof namedApi?.getLeaveRequests === 'function') return namedApi.getLeaveRequests(params)
  const res = await apiClient.get('/leave-requests', params)
  return {
    data: Array.isArray(res) ? res : (res?.data || []),
    pagination: res?.pagination || null,
  }
}

const createLeaveRequestFn = async (data) => {
  if (typeof api?.createLeaveRequest === 'function') return api.createLeaveRequest(data)
  if (typeof namedApi?.createLeaveRequest === 'function') return namedApi.createLeaveRequest(data)
  const res = await apiClient.post('/leave-requests', data)
  return res?.data || res
}

const reviewLeaveRequestFn = async (id, data) => {
  if (typeof api?.reviewLeaveRequest === 'function') return api.reviewLeaveRequest(id, data)
  if (typeof namedApi?.reviewLeaveRequest === 'function') return namedApi.reviewLeaveRequest(id, data)
  const res = await apiClient.patch(`/leave-requests/${id}/review`, data)
  return res?.data || res
}

const STATUS_BADGES = {
  PENDING: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
}

export default function LeaveManagementPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [leaves, setLeaves] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  // Apply Leave Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    reason: '',
    attachment: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Review Modal (For Admin)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [activeLeave, setActiveLeave] = useState(null)
  const [reviewDecision, setReviewDecision] = useState('APPROVED')
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const isManager = user?.isAdmin || user?.isSuperAdmin

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getLeaveRequestsFn({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        limit: 100,
      })
      setLeaves(res?.data || [])
    } catch (err) {
      showToast(err.message || 'Failed to fetch leave requests', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!formData.reason.trim()) {
      showToast('Please provide a reason for leave', 'error')
      return
    }

    try {
      setSubmitting(true)
      await createLeaveRequestFn(formData)
      showToast('Leave request submitted for administrative review', 'success')
      setApplyModalOpen(false)
      setFormData({
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        reason: '',
        attachment: '',
      })
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to submit leave', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    try {
      setReviewing(true)
      await reviewLeaveRequestFn(activeLeave.id, {
        status: reviewDecision,
        reviewRemarks: reviewRemarks.trim(),
      })
      showToast(`Leave request ${reviewDecision.toLowerCase()}!`, 'success')
      setReviewModalOpen(false)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Review action failed', 'error')
    } finally {
      setReviewing(false)
    }
  }

  // Quick Stats
  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management & Approvals"
        description="Formal leave applications, medical records, and administrative approval workflow"
        action={
          <Button
            onClick={() => setApplyModalOpen(true)}
            icon={Plus}
          >
            Apply for Leave
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Review</p>
              <h3 className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Awaiting administrator action</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Leaves</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-600">{approvedCount}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Sanctioned by management</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rejected / Closed</p>
              <h3 className="mt-1 text-2xl font-bold text-red-600">{rejectedCount}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <XCircle size={24} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Disallowed or retracted</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <h4 className="text-sm font-bold text-slate-800">
          {isManager ? 'All Staff & Student Leave Applications' : 'My Leave Applications'}
        </h4>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Only</option>
          <option value="APPROVED">Approved Only</option>
          <option value="REJECTED">Rejected Only</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No Leave Requests Found</h3>
          <p className="mt-1 text-xs text-slate-400">No leave records match the selected filter.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Applicant</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Review Info</th>
                  {isManager && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((leave) => {
                  const badgeConf = STATUS_BADGES[leave.status] || STATUS_BADGES.PENDING

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {leave.user?.name || 'Applicant'}
                        <div className="text-xs text-slate-400">{leave.user?.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {leave.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-700">
                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold border ${badgeConf.color}`}>
                          {badgeConf.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {leave.reviewedBy ? (
                          <div>
                            <span className="font-semibold text-slate-700">By {leave.reviewedBy.name}</span>
                            {leave.reviewRemarks && <div className="text-slate-400 italic">"{leave.reviewRemarks}"</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      {isManager && (
                        <td className="px-5 py-4 text-right">
                          {leave.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setActiveLeave(leave)
                                setReviewDecision('APPROVED')
                                setReviewRemarks('')
                                setReviewModalOpen(true)
                              }}
                              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Completed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Apply for Leave</h3>
                <p className="text-xs text-slate-500">Submit date range and reason for administrator sanction</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="From Date *"
                  type="date"
                  icon={Calendar}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <Input
                  label="To Date *"
                  type="date"
                  icon={Calendar}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="State the detailed reason for your leave (e.g. Medical illness, family emergency, exam duty)..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                  required
                />
              </div>

              <Input
                label="Medical Certificate / Supporting File URL (Optional)"
                placeholder="https://..."
                icon={FileText}
                value={formData.attachment}
                onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button type="submit" loading={submitting}>
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal (Admin) */}
      {reviewModalOpen && activeLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Review Leave Request</h3>
                <p className="text-xs text-slate-500">Applicant: {activeLeave.user?.name} ({activeLeave.role})</p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReview} className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs space-y-1">
                <p><strong>Duration:</strong> {new Date(activeLeave.startDate).toLocaleDateString()} to {new Date(activeLeave.endDate).toLocaleDateString()}</p>
                <p><strong>Reason:</strong> {activeLeave.reason}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition ${
                      reviewDecision === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Check size={16} /> Sanction (Approve)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('REJECTED')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition ${
                      reviewDecision === 'REJECTED'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <X size={16} /> Disallow (Reject)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Remarks / Note</label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g. Approved. Please ensure substitution is arranged for your classes."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button type="submit" loading={reviewing}>
                  Confirm Decision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
