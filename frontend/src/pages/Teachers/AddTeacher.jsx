import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  UserCheck,
  Printer,
  Download,
  UserPlus,
  CheckCircle2,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import TeacherForm from '../../components/teachers/TeacherForm'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

function AddTeacher() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [createdResult, setCreatedResult] = useState(null)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [formKey, setFormKey] = useState(1)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const created = await api.addTeacher(values)
      setSubmitting(false)
      showToast(`Teacher registered successfully! Teacher ID: ${created?.teacherId || 'Generated'}`, 'success')

      if (created?.credentials) {
        setCreatedResult(created)
      } else {
        navigate('/teachers')
      }
    } catch (err) {
      setSubmitting(false)
      showToast(err.message || 'Failed to add teacher', 'error')
    }
  }

  const handleCopyTeacherId = () => {
    if (!createdResult) return
    navigator.clipboard.writeText(createdResult.teacherId)
    setCopiedId(true)
    showToast('Teacher ID copied to clipboard!', 'success')
    setTimeout(() => setCopiedId(false), 3000)
  }

  const handleCopyPassword = () => {
    if (!createdResult?.credentials) return
    navigator.clipboard.writeText(createdResult.credentials.temporaryPassword)
    setCopiedPass(true)
    showToast('Temporary Password copied to clipboard!', 'success')
    setTimeout(() => setCopiedPass(false), 3000)
  }

  const handlePrintCredentials = () => {
    if (!createdResult) return
    const printWindow = window.open('', '_blank')
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Faculty Onboarding Credentials - ${createdResult.teacherId}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 25px; }
          .header h1 { margin: 0; color: #6d28d9; font-size: 26px; }
          .header p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
          .receipt-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
          .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 25px; background: #f8fafc; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 500; }
          .value { font-weight: bold; color: #0f172a; }
          .badge { display: inline-block; background: #dcfce7; color: #15803d; font-weight: bold; padding: 4px 10px; border-radius: 6px; font-size: 12px; }
          .notice { font-size: 12px; color: #64748b; margin-top: 30px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Daily Day Academy</h1>
          <p>Official Faculty Onboarding & Portal Credentials</p>
        </div>
        <div class="receipt-title">TEACHER CREDENTIALS VOUCHER</div>
        <div class="card">
          <div class="row"><span class="label">Teacher Name:</span><span class="value">${createdResult.name}</span></div>
          <div class="row"><span class="label">Teacher ID:</span><span class="value" style="color: #6d28d9; font-size: 16px;">${createdResult.teacherId}</span></div>
          <div class="row"><span class="label">Assigned Subject:</span><span class="value">${createdResult.subject || 'General'}</span></div>
          <div class="row"><span class="label">Login ID / Username:</span><span class="value">${createdResult.credentials?.username}</span></div>
          <div class="row"><span class="label">Temporary Password:</span><span class="value" style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${createdResult.credentials?.temporaryPassword}</span></div>
          <div class="row"><span class="label">Account Status:</span><span class="value"><span class="badge">Active</span></span></div>
          <div class="row"><span class="label">Faculty Portal:</span><span class="value">${window.location.origin}/login</span></div>
          <div class="row"><span class="label">Issue Date:</span><span class="value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
        </div>
        <div class="notice">
          <p>⚠️ <strong>Security Notice:</strong> The faculty member is required to change their temporary password upon first login.</p>
          <p>&copy; ${new Date().getFullYear()} Daily Day Academy. All Rights Reserved.</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `
    printWindow.document.write(content)
    printWindow.document.close()
  }

  const handleDownloadCredentials = () => {
    if (!createdResult) return
    const text = `=====================================================
            DAILY DAY ACADEMY
      FACULTY ONBOARDING & PORTAL CREDENTIALS
=====================================================

TEACHER ADDED SUCCESSFULLY

Teacher Name:       ${createdResult.name}
Teacher ID:         ${createdResult.teacherId}
Assigned Subject:   ${createdResult.subject || 'General'}
Login ID/Username:  ${createdResult.credentials?.username}
Temporary Password: ${createdResult.credentials?.temporaryPassword}
Account Status:     Active

Faculty Portal:     ${window.location.origin}/login
Issue Date:         ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

NOTE:
For account security, the teacher will be required to change 
their temporary password upon their first login.

=====================================================
Generated by Daily Day Academy School Management System
=====================================================`

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Teacher_Credentials_${createdResult.teacherId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Teacher credentials downloaded successfully!', 'success')
  }

  const handleAddAnother = () => {
    setCreatedResult(null)
    setFormKey((prev) => prev + 1)
  }

  return (
    <div>
      <PageHeader
        title="Add Teacher"
        description="Hire a new teacher and create their profile & portal account"
        breadcrumb={[
          { label: 'Teachers', href: '/teachers' },
          { label: 'Add Teacher' },
        ]}
        actions={
          <Link to="/teachers">
            <Button variant="outline" leftIcon={ArrowLeft}>
              Back to Teachers
            </Button>
          </Link>
        }
      />
      <TeacherForm key={formKey} onSubmit={handleSubmit} submitting={submitting} submitLabel="Submit Teacher Form" />

      {/* TEACHER ADDED SUCCESSFULLY Confirmation Modal */}
      {createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 mb-3 shadow-inner">
              <UserCheck size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              TEACHER ADDED SUCCESSFULLY
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Faculty profile and login account created. The teacher can login immediately.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Teacher Name:</span>
                <span className="font-bold text-slate-900">
                  {createdResult.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Teacher ID:</span>
                <span className="font-bold text-violet-600 font-mono text-sm">
                  {createdResult.teacherId}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Temporary Password:</span>
                <span className="font-bold text-slate-900 font-mono text-sm bg-slate-200/70 px-2 py-0.5 rounded">
                  {createdResult.credentials?.temporaryPassword}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-500 font-medium">Account Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Copy}
                  onClick={handleCopyTeacherId}
                >
                  {copiedId ? 'Copied ID!' : 'Copy Teacher ID'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Copy}
                  onClick={handleCopyPassword}
                >
                  {copiedPass ? 'Copied Password!' : 'Copy Password'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Printer}
                  onClick={handlePrintCredentials}
                >
                  Print Credentials
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Download}
                  onClick={handleDownloadCredentials}
                >
                  Download Credentials
                </Button>
              </div>

              <Button
                variant="primary"
                size="md"
                leftIcon={UserPlus}
                onClick={handleAddAnother}
                className="w-full mt-1 bg-violet-600 hover:bg-violet-700"
              >
                Add Another Teacher
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddTeacher
