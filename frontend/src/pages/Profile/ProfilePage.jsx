import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ShieldCheck, Pencil, KeyRound, UserCircle, GraduationCap, FileText, Download } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import MarksheetModal from '../../components/marksheets/MarksheetModal'
import TransferCertificateModal from '../../components/certificates/TransferCertificateModal'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  )
}

function ProfilePage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { showToast } = useToast()

  const [marksheets, setMarksheets] = useState([])
  const [tc, setTc] = useState(null)
  const [selectedMarksheet, setSelectedMarksheet] = useState(null)
  const [marksheetModalOpen, setMarksheetModalOpen] = useState(false)
  const [tcModalOpen, setTcModalOpen] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)

  const isStudentOrParent = user?.role === 'STUDENT' || user?.role === 'PARENT'

  useEffect(() => {
    if (!isStudentOrParent) return
    setLoadingDocs(true)
    Promise.all([
      api.getMyMarksheets().catch(() => []),
      api.getMyTransferCertificate().catch(() => null),
    ])
      .then(([msList, tcDoc]) => {
        setMarksheets(msList)
        setTc(tcDoc)
        setLoadingDocs(false)
      })
      .catch(() => {
        setLoadingDocs(false)
      })
  }, [isStudentOrParent])

  const handleOpenMarksheet = (ms) => {
    setSelectedMarksheet(ms)
    setMarksheetModalOpen(true)
  }

  const handleOpenTc = () => {
    if (!tc) {
      showToast('No approved Transfer Certificate found for your account.', 'info')
      return
    }
    setTcModalOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="View your account information and academic records"
        breadcrumb={[{ label: 'Profile' }]}
        actions={
          <>
            <Link to="/profile/change-password">
              <Button variant="outline" leftIcon={KeyRound}>Change Password</Button>
            </Link>
            <Link to="/profile/edit">
              <Button leftIcon={Pencil}>Edit Profile</Button>
            </Link>
          </>
        }
      />

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white shadow-lg">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-500 sm:justify-start">
                <Mail size={15} className="text-slate-400" /> {user?.email}
              </p>
              <p className="mt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <ShieldCheck size={14} /> {user?.role}
                </span>
              </p>
            </div>
          </div>
        </Card>

        <Card title="Account Information">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Full Name" value={user?.name} />
            <InfoItem label="Email Address" value={user?.email} />
            <InfoItem label="Role" value={user?.role} />
            <InfoItem label="Organization" value={settings.schoolName} />
            <InfoItem label="Academic Year" value={settings.academicYear} />
            <InfoItem label="Account Status" value="Active" />
          </div>
        </Card>

        {isStudentOrParent && (
          <Card title="Official Academic Documents" subtitle="Download and print official verified certificates">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Marksheet Cards */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Official Marksheets</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {marksheets.length > 0
                        ? `${marksheets.length} exam statement(s) available`
                        : 'Official examination results & performance'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                  {marksheets.length > 0 ? (
                    marksheets.map((ms, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        leftIcon={GraduationCap}
                        onClick={() => handleOpenMarksheet(ms)}
                      >
                        {ms.exam?.name || 'Marksheet'}
                      </Button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No published marksheets available yet.</span>
                  )}
                </div>
              </div>

              {/* Transfer Certificate Card */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Transfer Certificate (TC)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tc ? `TC No: ${tc.tcNumber} (${tc.status})` : 'Official School Leaving Certificate'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                  {tc ? (
                    <Button variant="outline" size="sm" leftIcon={FileText} onClick={handleOpenTc}>
                      View / Print TC
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Not issued yet.</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card title="Account Actions">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link to="/profile/edit" className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><UserCircle size={22} /></span>
              <div>
                <p className="font-semibold text-slate-900">Edit Profile</p>
                <p className="text-sm text-slate-500">Update your personal details</p>
              </div>
            </Link>
            <Link to="/profile/change-password" className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><KeyRound size={22} /></span>
              <div>
                <p className="font-semibold text-slate-900">Change Password</p>
                <p className="text-sm text-slate-500">Keep your account secure</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Marksheet Modal */}
      {selectedMarksheet && (
        <MarksheetModal
          open={marksheetModalOpen}
          onClose={() => setMarksheetModalOpen(false)}
          initialMarksheet={selectedMarksheet}
        />
      )}

      {/* TC Modal */}
      {tc && (
        <TransferCertificateModal
          open={tcModalOpen}
          onClose={() => setTcModalOpen(false)}
          initialCertificate={tc}
        />
      )}
    </div>
  )
}

export default ProfilePage
