import React, { useEffect, useState } from 'react'
import { Printer, Download, X, AlertCircle } from 'lucide-react'
import Button from '../common/Button'
import Loader from '../common/Loader'
import MarksheetDocument from './MarksheetDocument'
import { api } from '../../services/api'

export default function MarksheetModal({ open, onClose, studentId, examId, initialMarksheet = null }) {
  const [marksheet, setMarksheet] = useState(initialMarksheet)
  const [loading, setLoading] = useState(!initialMarksheet)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return

    if (initialMarksheet) {
      setMarksheet(initialMarksheet)
      setLoading(false)
      return
    }

    if (!studentId || !examId) return

    let mounted = true
    setLoading(true)
    setError(null)

    api
      .getMarksheet(studentId, examId)
      .then((data) => {
        if (mounted) {
          setMarksheet(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to generate marksheet.')
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [open, studentId, examId, initialMarksheet])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[min(92vh,900px)] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Topbar (hidden during print) */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 print:hidden shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Student Marksheet</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">Official statement of examination performance</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Printer}
              onClick={handlePrint}
              disabled={loading || Boolean(error)}
            >
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-2 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-slate-100/60 touch-scroll overscroll-contain">
          {loading ? (
            <div className="py-20">
              <Loader label="Generating official marksheet from database..." />
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center max-w-md mx-auto">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-900">Unable to generate marksheet</h4>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <MarksheetDocument marksheet={marksheet} />
          )}
        </div>
      </div>
    </div>
  )
}
