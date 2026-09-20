import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, AlertCircle } from 'lucide-react'
import Button from '../common/Button'
import Loader from '../common/Loader'
import MarksheetDocument from './MarksheetDocument'
import { api } from '../../services/api'

export default function MarksheetModal({ open, onClose, studentId, examId, initialMarksheet = null }) {
  const [marksheet, setMarksheet] = useState(initialMarksheet)
  const [loading, setLoading] = useState(!initialMarksheet)
  const [error, setError] = useState(null)
  const printAreaRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)

    if (initialMarksheet) {
      setMarksheet(initialMarksheet)
      setLoading(false)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }

    if (!studentId || !examId) return () => window.removeEventListener('keydown', handleKeyDown)

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
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, studentId, examId, initialMarksheet, onClose])

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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Dark Blur Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[min(92vh,900px)] flex flex-col overflow-hidden border border-slate-200 z-10 animate-scale-in"
      >
        {/* Modal Top Header (Hidden on Paper Print) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50/90 print:hidden shrink-0">
          <div className="min-w-0 pr-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              Student Marksheet (अंकसूची)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Official statement of examination performance • Daily Day Academy
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={Printer}
              onClick={handlePrint}
              disabled={loading || Boolean(error)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
            >
              Print / Save PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              aria-label="Close modal"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-slate-100/70 touch-scroll">
          <div ref={printAreaRef}>
            {loading ? (
              <div className="py-20 text-center">
                <Loader label="Generating official marksheet from database..." />
              </div>
            ) : error ? (
              <div className="py-12 px-6 text-center max-w-md mx-auto">
                <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <AlertCircle size={24} />
                </div>
                <h4 className="text-base font-bold text-slate-900">Unable to generate marksheet</h4>
                <p className="text-xs text-slate-500 mt-1">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <MarksheetDocument marksheet={marksheet} />
                <div className="flex items-center justify-center gap-3 pt-6 pb-2 print:hidden">
                  <Button
                    variant="primary"
                    leftIcon={Printer}
                    onClick={handlePrint}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md"
                  >
                    Print / Save PDF
                  </Button>
                  <Button variant="outline" onClick={onClose} className="bg-white">
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
