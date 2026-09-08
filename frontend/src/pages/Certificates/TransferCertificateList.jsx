import React, { useEffect, useState, useMemo } from 'react'
import { FileText, Plus, Printer, Search, Eye, Filter, CheckCircle2, ShieldAlert } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import Loader from '../../components/common/Loader'
import TransferCertificateModal from '../../components/certificates/TransferCertificateModal'
import GenerateTcModal from '../../components/certificates/GenerateTcModal'
import { api } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

const STATUS_BADGES = {
  GENERATED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  APPROVED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
}

export default function TransferCertificateList() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals
  const [selectedTc, setSelectedTc] = useState(null)
  const [tcModalOpen, setTcModalOpen] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [selectedStudentForTc, setSelectedStudentForTc] = useState(null)

  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'Admin', 'Super Admin', 'Administrator'].includes(user?.role)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.getTransferCertificates({ limit: 100 }).catch((err) => {
        console.error('Failed to load TCs:', err)
        return []
      }),
      api.getStudents({ limit: 100 }).catch((err) => {
        console.error('Failed to load students:', err)
        return []
      }),
    ])
      .then(([tcData, studentData]) => {
        setCertificates(Array.isArray(tcData) ? tcData : [])
        setStudents(Array.isArray(studentData) ? studentData : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading TC page:', err)
        setCertificates([])
        setStudents([])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCertificates = useMemo(() => {
    const list = Array.isArray(certificates) ? certificates : []
    return list.filter((tc) => {
      const matchSearch =
        !search ||
        tc.tcNumber?.toLowerCase().includes(search.toLowerCase()) ||
        tc.student?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        tc.student?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        tc.student?.studentId?.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'ALL' || tc.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [certificates, search, statusFilter])

  const handleOpenGenerate = () => {
    if (students.length > 0) {
      setSelectedStudentForTc(students[0])
      setGenerateModalOpen(true)
    }
  }

  const handleViewTc = (tc) => {
    setSelectedTc(tc)
    setTcModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfer Certificates (TC)"
        description="Official school transfer & leaving certificate issuance and records"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Transfer Certificates' }]}
        actions={
          isAdmin ? (
            <Button variant="primary" leftIcon={Plus} onClick={handleOpenGenerate}>
              Issue New TC
            </Button>
          ) : null
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_6px_24px_0_rgba(15,23,42,0.05)]">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search by student name, ID, or TC number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'GENERATED', label: 'Generated' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden" bodyClassName="p-0">
        {loading ? (
          <div className="py-20">
            <Loader label="Loading transfer certificates..." />
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-6 sm:p-8">
            <EmptyState
              icon={FileText}
              title="No Transfer Certificates Found"
              description="No transfer certificates match your search or filter criteria."
              actionLabel={isAdmin ? 'Issue New TC' : undefined}
              onAction={isAdmin ? handleOpenGenerate : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3.5 sm:py-3.5 sm:px-5">TC Number</th>
                  <th className="py-3 px-3.5 sm:py-3.5 sm:px-5">Student</th>
                  <th className="py-3 px-3.5 sm:py-3.5 sm:px-5">Class</th>
                  <th className="py-3 px-3.5 sm:py-3.5 sm:px-5">Date of Issue</th>
                  <th className="py-3 px-3.5 sm:py-3.5 sm:px-5">Reason</th>
                  <th className="py-3 px-3.5 sm:py-3.5 sm:px-5 text-center">Status</th>
                  <th className="py-3 px-3.5 sm:py-3.5 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredCertificates.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 sm:py-3.5 sm:px-5 font-mono font-bold text-indigo-900 whitespace-nowrap">{tc.tcNumber}</td>
                    <td className="py-3 px-3.5 sm:py-3.5 sm:px-5">
                      <div className="font-semibold text-slate-900">
                        {tc.student ? `${tc.student.firstName} ${tc.student.lastName || ''}`.trim() : '—'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{tc.student?.studentId}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">
                      {tc.student?.class ? `${tc.student.class.name} - ${tc.student.class.section}` : tc.lastClass || 'Class 10'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">{formatDate(tc.issueDate)}</td>
                    <td className="py-3.5 px-5 text-slate-600 truncate max-w-xs">{tc.reason || '—'}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_BADGES[tc.status] || 'bg-slate-100 text-slate-700'}`}>
                        {tc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={Eye}
                          onClick={() => handleViewTc(tc)}
                        >
                          View / Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View/Print TC Modal */}
      <TransferCertificateModal
        open={tcModalOpen}
        onClose={() => setTcModalOpen(false)}
        initialCertificate={selectedTc}
        onStatusChange={() => loadData()}
      />

      {/* Generate TC Modal */}
      <GenerateTcModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        student={selectedStudentForTc}
        students={students}
        onGenerated={(newTc) => {
          loadData()
          handleViewTc(newTc)
        }}
      />
    </div>
  )
}
