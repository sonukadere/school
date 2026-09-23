import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Search,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Plus,
  Trash2,
  DollarSign,
  X,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { apiClient } from '../../services/apiClient'

export default function StaffList() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('ALL')

  // Add Staff Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: 'Accountant',
    department: 'Accounts',
    salary: 40000,
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const canManage = user?.isAdmin || user?.isSuperAdmin

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/staff', { search: searchQuery, limit: 100 })
      setStaffList(res?.data || [])
    } catch (err) {
      showToast(err.message || 'Failed to load staff list', 'error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, showToast])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.position.trim()) {
      showToast('Staff name and position are required.', 'error')
      return
    }

    try {
      setSubmitting(true)
      await apiClient.post('/staff', {
        ...formData,
        salary: Number(formData.salary) || 0,
      })
      showToast('Staff member registered successfully!', 'success')
      setModalOpen(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: 'Accountant',
        department: 'Accounts',
        salary: 40000,
        address: '',
      })
      fetchStaff()
    } catch (err) {
      showToast(err.message || 'Failed to register staff', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff profile?')) return
    try {
      await apiClient.delete(`/staff/${id}`)
      showToast('Staff member deleted', 'success')
      fetchStaff()
    } catch (err) {
      showToast(err.message || 'Failed to delete staff', 'error')
    }
  }

  const departments = Array.from(
    new Set(staffList.map((s) => s.department).filter(Boolean))
  )

  const filteredStaff = staffList.filter((s) => {
    const matchesDept = selectedDepartment === 'ALL' || s.department === selectedDepartment
    const matchesSearch =
      !searchQuery ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesDept && matchesSearch
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Administrative Personnel"
        description="Directory of non-teaching staff, accountants, front office receptionists, and administration"
        action={
          canManage && (
            <Button
              onClick={() => setModalOpen(true)}
              icon={Plus}
            >
              Add Staff Member
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
              placeholder="Search staff by name, position, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Total Staff: {filteredStaff.length}
        </span>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No Staff Members Found</h3>
          <p className="mt-1 text-xs text-slate-400">Add administrative personnel to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                      {staff.staffId}
                    </span>
                    <h4 className="mt-1 text-base font-bold text-slate-800">{staff.name}</h4>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                    {staff.position}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {staff.department && (
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" />
                      <span className="font-medium text-slate-700">{staff.department} Department</span>
                    </div>
                  )}
                  {staff.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <a href={`tel:${staff.phone}`} className="hover:text-indigo-600 font-semibold">
                        {staff.phone}
                      </a>
                    </div>
                  )}
                  {staff.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <a href={`mailto:${staff.email}`} className="text-slate-600 hover:underline truncate">
                        {staff.email}
                      </a>
                    </div>
                  )}
                </div>

                {staff.salary !== null && staff.salary !== undefined && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Monthly Compensation</span>
                    <span className="font-bold text-emerald-600">
                      ₹{Number(staff.salary).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {canManage && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Delete Staff"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Register Staff Member</h3>
                <p className="text-xs text-slate-500">Add non-teaching employee to administrative database</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-4 sm:p-6 space-y-4">
              <Input
                label="Full Name *"
                placeholder="e.g. Ramesh Verma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Designation / Position *"
                  placeholder="e.g. Accountant, Receptionist, Clerk"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />

                <Input
                  label="Department"
                  placeholder="e.g. Accounts, Front Office, Admin"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Contact Phone"
                  placeholder="9876543210"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="staff@school.com"
                  icon={Mail}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <Input
                label="Monthly Salary (₹)"
                type="number"
                icon={DollarSign}
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                  Save Staff Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
