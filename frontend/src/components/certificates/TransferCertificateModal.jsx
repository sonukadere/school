import React, { useEffect, useState } from 'react'
import { Printer, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import Button from '../common/Button'
import Loader from '../common/Loader'
import TransferCertificateDocument from './TransferCertificateDocument'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'

export default function TransferCertificateModal({ open, onClose, studentId, tcId, initialCertificate = null, onStatusChange }) {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Topbar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Transfer Certificate</h3>
            <p className="text-xs text-slate-500">Official School Leaving Certificate</p>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60">
          {loading ? (
            <div className="py-20">
              <Loader label="Fetching transfer certificate details..." />
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center max-w-md mx-auto">
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
            <TransferCertificateDocument certificate={certificate} />
          )}
        </div>
      </div>
    </div>
  )
}
