import { useRef, useState, useEffect } from 'react'
import {
  Camera,
  Save,
  RotateCcw,
  Building2,
  Mail,
  Server,
  Key,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../services/api'
import { cn } from '../../utils/helpers'

const SMTP_PRESETS = [
  {
    name: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    tip: 'Requires a Google App Password (not your personal password).',
  },
  {
    name: 'Microsoft 365 / Outlook',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    tip: 'Requires SMTP AUTH enabled in Microsoft 365 Admin.',
  },
  {
    name: 'Zoho Mail',
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    tip: 'Requires Zoho Application Password with Two-Factor Auth.',
  },
]

function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  // Active Tab: 'general' | 'smtp'
  const [activeTab, setActiveTab] = useState('general')

  // --- General Settings State ---
  const [generalValues, setGeneralValues] = useState({
    schoolName: settings.schoolName || '',
    address: settings.address || '',
    contactNumber: settings.contactNumber || settings.phone || '',
    email: settings.email || '',
    academicYear: settings.academicYear || '',
    currency: settings.currency || '₹',
  })
  const [generalErrors, setGeneralErrors] = useState({})
  const [generalSubmitting, setGeneralSubmitting] = useState(false)

  // --- SMTP Settings State ---
  const [smtpValues, setSmtpValues] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: settings.schoolName || 'Daily Day Academy',
    fromEmail: settings.email || 'no-reply@dailydayacademy.edu',
  })
  const [smtpStatus, setSmtpStatus] = useState({
    isConfigured: false,
    hasPassword: false,
    loading: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [smtpSubmitting, setSmtpSubmitting] = useState(false)

  // --- Test Email State ---
  const [testRecipient, setTestRecipient] = useState('')
  const [testTesting, setTestTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // { success: boolean, message: string }

  // Sync general values when settings change
  useEffect(() => {
    setGeneralValues({
      schoolName: settings.schoolName || '',
      address: settings.address || '',
      contactNumber: settings.contactNumber || settings.phone || '',
      email: settings.email || '',
      academicYear: settings.academicYear || '',
      currency: settings.currency || '₹',
    })
  }, [settings])

  // Fetch SMTP Settings on Mount
  useEffect(() => {
    let isMounted = true
    const loadSmtp = async () => {
      try {
        const res = await api.getSmtpSettings()
        const data = res?.data || res
        if (isMounted && data) {
          setSmtpValues((prev) => ({
            ...prev,
            host: data.host || '',
            port: data.port || 587,
            secure: Boolean(data.secure),
            user: data.user || '',
            fromName: data.fromName || settings.schoolName || 'Daily Day Academy',
            fromEmail: data.fromEmail || settings.email || 'no-reply@dailydayacademy.edu',
            pass: data.hasPassword ? '••••••••' : '',
          }))
          setSmtpStatus({
            isConfigured: Boolean(data.isConfigured),
            hasPassword: Boolean(data.hasPassword),
            loading: false,
          })
          if (data.fromEmail && !testRecipient) {
            setTestRecipient(data.fromEmail)
          }
        }
      } catch (err) {
        console.warn('Could not load SMTP settings:', err.message)
        if (isMounted) setSmtpStatus((prev) => ({ ...prev, loading: false }))
      }
    }

    loadSmtp()
    return () => {
      isMounted = false
    }
  }, [settings.schoolName, settings.email])

  // Handlers for General Settings
  const handleGeneralChange = (event) => {
    const { name, value } = event.target
    setGeneralValues((prev) => ({ ...prev, [name]: value }))
    if (generalErrors[name]) setGeneralErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleLogo = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateSettings({ schoolLogo: reader.result })
    reader.readAsDataURL(file)
  }

  const handleGeneralSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!generalValues.schoolName.trim()) nextErrors.schoolName = 'School name is required'
    if (!generalValues.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(generalValues.email)) nextErrors.email = 'Enter a valid email'
    setGeneralErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setGeneralSubmitting(true)
    try {
      await updateSettings(generalValues)
      showToast('School profile saved successfully', 'success')
    } catch {
      showToast('Failed to save settings', 'error')
    } finally {
      setGeneralSubmitting(false)
    }
  }

  const handleReset = () => {
    resetSettings()
    setGeneralValues({
      schoolName: settings.schoolName,
      address: settings.address,
      contactNumber: settings.contactNumber,
      email: settings.email,
      academicYear: settings.academicYear,
      currency: settings.currency,
    })
    showToast('Settings reset to defaults', 'info')
  }

  // Handlers for SMTP Settings
  const handleSmtpChange = (event) => {
    const { name, value, type, checked } = event.target
    setSmtpValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setTestResult(null)
  }

  const applyPreset = (preset) => {
    setSmtpValues((prev) => ({
      ...prev,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
    }))
    setTestResult(null)
    showToast(`Applied preset for ${preset.name}`, 'info')
  }

  const handleSmtpSubmit = async (event) => {
    event.preventDefault()
    setSmtpSubmitting(true)
    setTestResult(null)

    try {
      const payload = {
        host: smtpValues.host.trim(),
        port: Number(smtpValues.port),
        secure: Boolean(smtpValues.secure),
        user: smtpValues.user.trim(),
        fromName: smtpValues.fromName.trim(),
        fromEmail: smtpValues.fromEmail.trim(),
      }

      // If user altered password from placeholder
      if (smtpValues.pass && smtpValues.pass !== '••••••••') {
        payload.pass = smtpValues.pass
      }

      const res = await api.updateSmtpSettings(payload)
      const data = res?.data || res

      setSmtpStatus({
        isConfigured: Boolean(data?.isConfigured),
        hasPassword: Boolean(data?.hasPassword),
        loading: false,
      })

      if (data?.hasPassword) {
        setSmtpValues((prev) => ({ ...prev, pass: '••••••••' }))
      }

      showToast('SMTP email configuration saved successfully!', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update SMTP settings', 'error')
    } finally {
      setSmtpSubmitting(false)
    }
  }

  const handleSendTestEmail = async (event) => {
    event.preventDefault()
    if (!testRecipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient)) {
      showToast('Please enter a valid recipient email address for testing.', 'warning')
      return
    }

    setTestTesting(true)
    setTestResult(null)

    try {
      const payload = {
        recipientEmail: testRecipient.trim(),
        host: smtpValues.host.trim(),
        port: Number(smtpValues.port),
        secure: Boolean(smtpValues.secure),
        user: smtpValues.user.trim(),
        fromName: smtpValues.fromName.trim(),
        fromEmail: smtpValues.fromEmail.trim(),
      }

      if (smtpValues.pass && smtpValues.pass !== '••••••••') {
        payload.pass = smtpValues.pass
      }

      const res = await api.testSmtpConnection(payload)
      const message = res?.message || `Test email successfully sent to ${testRecipient}`

      setTestResult({
        success: true,
        message,
      })
      showToast('Test email sent successfully!', 'success')
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send test email'
      setTestResult({
        success: false,
        message: errorMsg,
      })
      showToast('SMTP Test failed. Inspect error details below.', 'error')
    } finally {
      setTestTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your school profile, academic parameters, and email services"
        breadcrumb={[{ label: 'Settings' }]}
        actions={
          activeTab === 'general' ? (
            <Button variant="outline" leftIcon={RotateCcw} onClick={handleReset}>
              Reset Defaults
            </Button>
          ) : null
        }
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors',
            activeTab === 'general'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Building2 size={18} />
          School Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('smtp')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors',
            activeTab === 'smtp'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Mail size={18} />
          Email & SMTP Configuration
          {smtpStatus.isConfigured ? (
            <span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              Active
            </span>
          ) : (
            <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Setup Required
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: School Profile */}
      {activeTab === 'general' && (
        <form onSubmit={handleGeneralSubmit} className="space-y-6">
          <Card title="School Logo" className="max-w-3xl">
            <div className="flex flex-col min-[480px]:flex-row items-center gap-4 sm:gap-6 text-center min-[480px]:text-left">
              <div className="relative shrink-0">
                {settings.schoolLogo ? (
                  <img
                    src={settings.schoolLogo}
                    alt="School logo"
                    className="h-24 w-24 rounded-2xl object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                    <Building2 size={40} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                  aria-label="Upload logo"
                >
                  <Camera size={15} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{settings.schoolName}</p>
                <p className="mt-1 text-sm text-slate-500">Upload a square image (PNG, JPG, or SVG) for best results.</p>
                {settings.schoolLogo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-rose-600 hover:bg-rose-50"
                    onClick={() => updateSettings({ schoolLogo: '' })}
                  >
                    Remove logo
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card title="School Information" className="max-w-3xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="School Name"
                  name="schoolName"
                  value={generalValues.schoolName}
                  onChange={handleGeneralChange}
                  error={generalErrors.schoolName}
                  required
                  placeholder="Enter official school name"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address"
                  name="address"
                  value={generalValues.address}
                  onChange={handleGeneralChange}
                  placeholder="Enter full physical address"
                />
              </div>
              <Input
                label="Contact Number"
                name="contactNumber"
                value={generalValues.contactNumber}
                onChange={handleGeneralChange}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Official Email"
                type="email"
                name="email"
                value={generalValues.email}
                onChange={handleGeneralChange}
                error={generalErrors.email}
                required
                placeholder="info@school.com"
              />
              <Input
                label="Academic Year"
                name="academicYear"
                value={generalValues.academicYear}
                onChange={handleGeneralChange}
                placeholder="2026-2027"
              />
              <Input
                label="Currency Symbol"
                name="currency"
                value={generalValues.currency}
                onChange={handleGeneralChange}
                placeholder="₹"
              />
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="submit" loading={generalSubmitting} leftIcon={Save} className="w-full sm:w-auto">
                Save School Profile
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* TAB 2: Email & SMTP Configuration */}
      {activeTab === 'smtp' && (
        <div className="space-y-6 max-w-4xl">
          {/* Status Indicator Banner */}
          <div
            className={cn(
              'rounded-xl border p-4 sm:p-5 flex items-start gap-3.5 transition-all',
              smtpStatus.isConfigured
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            )}
          >
            {smtpStatus.isConfigured ? (
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <h4 className="font-semibold text-base mb-0.5">
                {smtpStatus.isConfigured
                  ? 'SMTP Email Gateway Active'
                  : 'SMTP Email Service Not Configured'}
              </h4>
              <p className="opacity-90">
                {smtpStatus.isConfigured
                  ? 'System emails, password reset instructions, student notifications, and fee alerts will be securely delivered via your configured mail server.'
                  : 'Configure your SMTP credentials below so the system can deliver password reset emails, receipts, and automated academic notifications.'}
              </p>
            </div>
          </div>

          {/* Quick Setup Presets */}
          <Card
            title="Quick Setup Providers"
            subtitle="Click a preset to auto-populate host and port settings"
            icon={Zap}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SMTP_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'flex flex-col items-start p-3.5 text-left rounded-xl border transition-all text-xs',
                    smtpValues.host === preset.host
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span className="font-bold text-slate-900 mb-1">{preset.name}</span>
                  <span className="text-slate-500 mb-2">
                    {preset.host}:{preset.port} ({preset.secure ? 'SSL' : 'TLS'})
                  </span>
                  <span className="text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {preset.tip}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Main SMTP Config Form */}
          <form onSubmit={handleSmtpSubmit}>
            <Card
              title="SMTP Server Credentials"
              subtitle="Credentials are encrypted and safely stored in the school database"
              icon={Server}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Host */}
                <div className="sm:col-span-2">
                  <Input
                    label="SMTP Host / Server"
                    name="host"
                    value={smtpValues.host}
                    onChange={handleSmtpChange}
                    required
                    placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
                    icon={Server}
                    helper="The hostname of your outgoing SMTP server."
                  />
                </div>

                {/* Port */}
                <Input
                  label="SMTP Port"
                  type="number"
                  name="port"
                  value={smtpValues.port}
                  onChange={handleSmtpChange}
                  required
                  placeholder="587"
                  helper="Common ports: 587 (STARTTLS), 465 (SSL/TLS), 25"
                />

                {/* Encryption Mode */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Encryption Protocol
                  </label>
                  <select
                    name="secure"
                    value={smtpValues.secure ? 'true' : 'false'}
                    onChange={(e) =>
                      setSmtpValues((prev) => ({
                        ...prev,
                        secure: e.target.value === 'true',
                      }))
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 text-sm text-slate-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4 focus:border-indigo-500 focus:ring-indigo-500/10"
                  >
                    <option value="false">STARTTLS / Opportunistic TLS (Port 587 / 25)</option>
                    <option value="true">Direct SSL / TLS (Port 465)</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Select SSL/TLS for port 465 or STARTTLS for port 587.</p>
                </div>

                {/* SMTP Username */}
                <Input
                  label="SMTP Username / Account"
                  name="user"
                  value={smtpValues.user}
                  onChange={handleSmtpChange}
                  required
                  placeholder="e.g. your-email@school.com"
                  icon={Mail}
                  helper="Username used to authenticate with your SMTP provider."
                />

                {/* SMTP Password */}
                <div className="w-full">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    SMTP Password / App Password
                  </label>
                  <div className="relative">
                    <Key
                      size={18}
                      className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="pass"
                      value={smtpValues.pass}
                      onChange={handleSmtpChange}
                      placeholder={smtpStatus.hasPassword ? '•••••••• (unchanged)' : 'Enter SMTP password'}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/40 pl-10 pr-11 text-sm text-slate-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4 focus:border-indigo-500 focus:ring-indigo-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {smtpStatus.hasPassword
                      ? 'A password is currently saved. Leave as •••••••• to keep it.'
                      : 'Use an App-specific password if 2-Factor Authentication is enabled.'}
                  </p>
                </div>

                {/* Sender Display Name */}
                <Input
                  label="Sender Display Name"
                  name="fromName"
                  value={smtpValues.fromName}
                  onChange={handleSmtpChange}
                  required
                  placeholder="e.g. Daily Day Academy"
                  helper="Display name visible to parents, teachers, and students."
                />

                {/* Sender Email */}
                <Input
                  label="Sender 'From' Email"
                  type="email"
                  name="fromEmail"
                  value={smtpValues.fromEmail}
                  onChange={handleSmtpChange}
                  required
                  placeholder="e.g. no-reply@school.com"
                  helper="The outgoing email address shown in the 'From' header."
                />
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  loading={smtpSubmitting}
                  leftIcon={Save}
                  className="w-full sm:w-auto"
                >
                  Save SMTP Settings
                </Button>
              </div>
            </Card>
          </form>

          {/* Test SMTP Connection Card */}
          <Card
            title="Send Test Email"
            subtitle="Verify network connectivity and credentials with a live test message"
            icon={Send}
          >
            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    label="Test Recipient Email"
                    type="email"
                    name="testRecipient"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    required
                    placeholder="Enter email to receive test verification message"
                    icon={Mail}
                  />
                </div>
                <div className="sm:self-end">
                  <Button
                    type="submit"
                    loading={testTesting}
                    leftIcon={Send}
                    variant="secondary"
                    className="w-full sm:w-auto h-11"
                  >
                    Send Test Email
                  </Button>
                </div>
              </div>

              {/* Diagnostic Test Feedback Box */}
              {testResult && (
                <div
                  className={cn(
                    'mt-4 rounded-xl border p-4 text-sm transition-all',
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {testResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className="font-semibold mb-1">
                        {testResult.success
                          ? 'Test Email Successfully Delivered!'
                          : 'SMTP Test Failed'}
                      </h5>
                      <p className="text-xs font-mono break-all opacity-95">
                        {testResult.message}
                      </p>
                      {!testResult.success && (
                        <div className="mt-2 text-xs text-rose-700">
                          <p className="font-medium">Troubleshooting Suggestions:</p>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-90">
                            <li>Check if your SMTP host and port are correct (587 for TLS, 465 for SSL).</li>
                            <li>For Gmail, generate an <strong>App Password</strong> in your Google Account security settings.</li>
                            <li>Ensure your firewall or hosting provider allows outbound traffic on your chosen SMTP port.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SettingsPage
