import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import Button from '../common/Button'
import Loader from '../common/Loader'
import TransferCertificateDocument from './TransferCertificateDocument'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

export default function TransferCertificateModal({
  open,
  onClose,
  studentId,
  tcId,
  initialCertificate = null,
  onStatusChange,
}) {
  const { showToast } = useToast()
  const [certificate, setCertificate] = useState(initialCertificate)
  const [loading, setLoading] = useState(!initialCertificate)
  const [error, setError] = useState(null)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    if (!open) return

    if (initialCertificate) {
      setCertificate(initialCertificate)
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    setError(null)

    const fetchPromise = tcId
      ? api.getTransferCertificate(tcId)
      : studentId
      ? api.getStudentTransferCertificate(studentId)
      : Promise.resolve(null)

    fetchPromise
      .then((data) => {
        if (mounted) {
          if (!data) {
            setError('No Transfer Certificate has been generated for this student yet.')
          } else {
            setCertificate(data)
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load transfer certificate.')
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [open, studentId, tcId, initialCertificate])

  useEffect(() => {
    if (!open) return
    const prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('modal-print-mode')

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.body.classList.remove('modal-print-mode')
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const handlePrint = () => {
    window.print()
  }

  const handleApprove = async () => {
    if (!certificate?.id) return
    setApproving(true)
    try {
      const updated = await api.updateTransferCertificate(certificate.id, { status: 'APPROVED' })
      setCertificate(updated)
      showToast('Transfer Certificate approved successfully', 'success')
      if (onStatusChange) onStatusChange(updated)
    } catch (err) {
      showToast(err.message || 'Failed to approve certificate', 'error')
    } finally {
      setApproving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 print:p-0 print:m-0 print:static print:block">
      {/* Semi-transparent backdrop with click-to-close */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-10 animate-scale-in print:border-none print:shadow-none print:max-h-none print:w-full print:p-0 print:m-0 print:static print:block print:overflow-visible"
      >
        {/* Fixed Modal Topbar (hidden during print) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0 print:hidden">
          <div className="min-w-0 pr-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              Transfer Certificate
            </h3>
            <p className="text-xs text-slate-500 truncate">
              Official School Leaving Certificate
              {certificate?.tcNumber ? ` • ${certificate.tcNumber}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {certificate?.status === 'PENDING' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={CheckCircle2}
                onClick={handleApprove}
                loading={approving}
              >
                Approve TC
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={Printer}
              onClick={handlePrint}
              disabled={loading || Boolean(error)}
            >
              Print / Save PDF
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Workspace */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-slate-100/70 touch-scroll overscroll-contain print:bg-white print:p-0 print:m-0 print:overflow-visible print:block">
          {loading ? (
            <div className="py-24 flex items-center justify-center">
              <Loader label="Fetching transfer certificate details..." />
            </div>
          ) : error ? (
            <div className="py-16 px-6 text-center max-w-md mx-auto my-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-900">Certificate Unavailable</h4>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="w-full flex justify-center py-1 print:p-0 print:m-0 print:block">
              <TransferCertificateDocument certificate={certificate} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
