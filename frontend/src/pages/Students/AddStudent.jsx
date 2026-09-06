import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Printer,
  Download,
  Users,
  UserCheck,
  KeyRound,
  FileCheck,
} from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StudentForm from '../../components/students/StudentForm'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import { useToast } from '../../context/ToastContext'

function AddStudent() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [createdResult, setCreatedResult] = useState(null)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const created = await api.addStudent(values)
      setSubmitting(false)
      showToast(`Student registered successfully! Student ID: ${created?.studentId || 'Generated'}`, 'success')

      if (created?.credentials) {
        setCreatedResult(created)
      } else {
        navigate('/students')
      }
    } catch (err) {
      setSubmitting(false)
      showToast(err.message || 'Failed to add student', 'error')
    }
  }

  const handleCopyStudentId = () => {
    if (!createdResult) return
    navigator.clipboard.writeText(createdResult.studentId)
    setCopiedId(true)
    showToast('Student ID copied to clipboard!', 'success')
    setTimeout(() => setCopiedId(false), 3000)
  }

  const handleCopyPassword = () => {
    if (!createdResult?.credentials) return
    navigator.clipboard.writeText(createdResult.credentials.temporaryPassword)
    setCopiedPass(true)
    showToast('Temporary Password copied to clipboard!', 'success')
    setTimeout(() => setCopiedPass(false), 3000)
  }

  const handlePrintReceipt = () => {
    if (!createdResult) return
    const printWindow = window.open('', '_blank')
    const studentName = createdResult.fullName || `${createdResult.firstName} ${createdResult.lastName || ''}`.trim()
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Admission Receipt - ${createdResult.studentId}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 25px; }
          .header h1 { margin: 0; color: #4338ca; font-size: 26px; }
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
          <p>Official Student Admission & Portal Credentials Document</p>
        </div>
        <div class="receipt-title">STUDENT ADMISSION RECEIPT</div>
        <div class="card">
          <div class="row"><span class="label">Student Full Name:</span><span class="value">${studentName}</span></div>
          <div class="row"><span class="label">Student ID:</span><span class="value" style="color: #4338ca; font-size: 16px;">${createdResult.studentId}</span></div>
          <div class="row"><span class="label">Class & Section:</span><span class="value">${createdResult.className || createdResult.class?.name || 'Assigned'} ${createdResult.section || ''}</span></div>
          <div class="row"><span class="label">Login ID / Username:</span><span class="value">${createdResult.credentials?.username}</span></div>
          <div class="row"><span class="label">Temporary Password:</span><span class="value" style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${createdResult.credentials?.temporaryPassword}</span></div>
          <div class="row"><span class="label">Account Status:</span><span class="value"><span class="badge">Active</span></span></div>
          <div class="row"><span class="label">Portal Web Address:</span><span class="value">${window.location.origin}/login</span></div>
          <div class="row"><span class="label">Admission Date:</span><span class="value">${formatDate(new Date())}</span></div>
        </div>
        <div class="notice">
          <p>⚠️ <strong>Security Notice:</strong> The student is required to change their temporary password upon their first login to ensure account security.</p>
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

  const handleDownloadReceipt = () => {
    if (!createdResult) return
    const studentName = createdResult.fullName || `${createdResult.firstName} ${createdResult.lastName || ''}`.trim()
    const text = `=====================================================
            DAILY DAY ACADEMY
      STUDENT ADMISSION & PORTAL CREDENTIALS
=====================================================

STUDENT ADMISSION SUCCESSFUL

Student Name:       ${studentName}
Student ID:         ${createdResult.studentId}
Class & Section:    ${createdResult.className || createdResult.class?.name || 'Assigned'} ${createdResult.section || ''}
Login ID/Username:  ${createdResult.credentials?.username}
Temporary Password: ${createdResult.credentials?.temporaryPassword}
Account Status:     Active

Portal URL:         ${window.location.origin}/login
Admission Date:     ${formatDate(new Date())}

NOTE:
For account security, the student will be required to change 
their temporary password upon their first login.

=====================================================
Generated by Daily Day Academy School Management System
=====================================================`

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Admission_Receipt_${createdResult.studentId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Admission receipt downloaded successfully!', 'success')
  }

  return (
    <div>
      <PageHeader
        title="Student Admission"
        description="Register a new student and generate portal login credentials"
        breadcrumb={[
          { label: 'Students', href: '/students' },
          { label: 'Student Admission' },
        ]}
        actions={
          <Link to="/students">
            <Button variant="outline" leftIcon={ArrowLeft}>
              Back to Students
            </Button>
          </Link>
        }
      />
      <StudentForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Complete Admission" />

      {/* STUDENT ADMISSION SUCCESSFUL Confirmation Modal */}
      {createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-3 shadow-inner">
              <UserCheck size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              STUDENT ADMISSION SUCCESSFUL
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Student profile and portal account created. The student can login immediately.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Student Name:</span>
                <span className="font-bold text-slate-900">
                  {createdResult.fullName || `${createdResult.firstName} ${createdResult.lastName || ''}`.trim()}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Student ID:</span>
                <span className="font-bold text-indigo-600 font-mono text-sm">
                  {createdResult.studentId}
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
                  onClick={handleCopyStudentId}
                >
                  {copiedId ? 'Copied ID!' : 'Copy Student ID'}
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
                  onClick={handlePrintReceipt}
                >
                  Print Admission Receipt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Download}
                  onClick={handleDownloadReceipt}
                >
                  Download Admission Receipt
                </Button>
              </div>

              <Button
                variant="primary"
                size="md"
                leftIcon={Users}
                onClick={() => navigate('/students')}
                className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Student Management
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddStudent
