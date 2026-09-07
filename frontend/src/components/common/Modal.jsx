import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/helpers'

const SIZE_STYLES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  hideClose = false,
}) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-scale-in relative w-full rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col',
          SIZE_STYLES[size],
        )}
      >
        {!hideClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 z-10"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        )}
        {(title || description) && (
          <div className="border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-5 shrink-0 pr-12">
            {title && <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>}
            {description && <p className="mt-1 text-xs sm:text-sm text-slate-500">{description}</p>}
          </div>
        )}
        <div className="max-h-[85dvh] sm:max-h-[75vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 touch-scroll">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 border-t border-slate-200 px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
