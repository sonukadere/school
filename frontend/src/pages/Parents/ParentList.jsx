import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Search,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { apiClient } from '../../services/apiClient'

export default function ParentList() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [parents, setParents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // Create Parent Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    occupation: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const canManage = user?.isAdmin || user?.isSuperAdmin

  const fetchParents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/parents', { search: searchQuery, limit: 100 })
      setParents(res?.data || [])
    } catch (err) {
      showToast(err.message || 'Failed to load parents list', 'error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, showToast])

  useEffect(() => {
    fetchParents()
  }, [fetchParents])

  const handleCreateParent = async (e) => {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      showToast('First name, last name, and phone are required.', 'error')
      return
    }

    try {
      setSubmitting(true)
      await apiClient.post('/parents', formData)
      showToast('Parent profile registered successfully!', 'success')
      setModalOpen(false)
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        occupation: '',
        address: '',
      })
      fetchParents()
    } catch (err) {
      showToast(err.message || 'Failed to create parent profile', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteParent = async (id) => {
    if (!window.confirm('Are you sure you want to remove this parent profile?')) return
    try {
      await apiClient.delete(`/parents/${id}`)
      showToast('Parent profile deleted', 'success')
      fetchParents()
    } catch (err) {
      showToast(err.message || 'Failed to delete parent', 'error')
    }
  }

  const filteredParents = parents.filter((p) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.parentId?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parents & Guardians Directory"
        description="Comprehensive directory of student parents, emergency contact phone numbers, and family linkages"
        action={
          canManage && (
            <Button
              onClick={() => setModalOpen(true)}
              icon={Plus}
            >
              Add Parent Profile
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search parent name, phone, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredParents.length} parent records
        </span>
      </div>

      {/* Parents Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">No Parent Records Found</h3>
          <p className="mt-1 text-xs text-slate-400">Add parents or link them to student profiles during admission.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredParents.map((parent) => (
            <div
              key={parent.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                      {parent.parentId || 'PARENT'}
                    </span>
                    <h4 className="mt-1 text-base font-bold text-slate-800">
                      {parent.firstName} {parent.lastName}
                    </h4>
                  </div>
                  {parent.occupation && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Briefcase size={11} /> {parent.occupation}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <a href={`tel:${parent.phone}`} className="font-semibold text-slate-800 hover:text-indigo-600">
                      {parent.phone}
                    </a>
                  </div>
                  {parent.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <a href={`mailto:${parent.email}`} className="text-slate-600 hover:underline truncate">
                        {parent.email}
                      </a>
                    </div>
                  )}
                  {parent.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-500 line-clamp-1">{parent.address}</span>
                    </div>
                  )}
                </div>

                {/* Linked Children */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Enrolled Children ({parent.children?.length || 0})
                  </p>
                  {parent.children?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {parent.children.map((child) => (
                        <span
                          key={child.id}
                          className="flex items-center gap-1 rounded-lg bg-indigo-50/80 px-2 py-1 text-[11px] font-bold text-indigo-700"
                        >
                          <GraduationCap size={12} />
                          {child.firstName} {child.lastName || ''} ({child.studentId})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No linked students</p>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleDeleteParent(parent.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Delete Parent"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Parent Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-fade-in max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Add Parent Profile</h3>
                <p className="text-xs text-slate-500">Register parent or legal guardian details</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateParent} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="First Name *"
                  placeholder="e.g. Ramesh"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name *"
                  placeholder="e.g. Verma"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="Contact Phone *"
                  placeholder="9876543210"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="parent@example.com"
                  icon={Mail}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <Input
                label="Occupation / Profession"
                placeholder="e.g. Civil Engineer / Doctor / Business"
                icon={Briefcase}
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />

              <Input
                label="Home Address"
                placeholder="e.g. 45, Scheme No. 54, Vijay Nagar, Indore"
                icon={MapPin}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  Save Parent
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
