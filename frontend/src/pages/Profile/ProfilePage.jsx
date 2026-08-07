import { Link } from 'react-router-dom'
import { Mail, ShieldCheck, Pencil, KeyRound, UserCircle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'

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

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="View your account information"
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
    </div>
  )
}

export default ProfilePage
