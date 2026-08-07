import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../utils/helpers'

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', iconColor: 'text-emerald-500', bar: 'bg-emerald-500' },
  error: { icon: AlertCircle, ring: 'border-rose-200', iconColor: 'text-rose-500', bar: 'bg-rose-500' },
  info: { icon: Info, ring: 'border-sky-200', iconColor: 'text-sky-500', bar: 'bg-sky-500' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => removeToast(id), 3500)
    },
    [removeToast],
  )

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info
          const Icon = style.icon
          return (
            <div
              key={toast.id}
              className={cn(
                'animate-slide-in-right relative flex items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-lg',
                style.ring,
              )}
            >
              <span className={cn('absolute inset-y-0 left-0 w-1', style.bar)} />
              <Icon size={20} className={cn('mt-0.5 shrink-0', style.iconColor)} />
              <p className="flex-1 text-sm font-medium text-slate-700">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
