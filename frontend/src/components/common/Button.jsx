import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/helpers'

const VARIANT_STYLES = {
  primary: 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/25 active:scale-[0.98] border border-indigo-500/20',
  secondary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm shadow-slate-900/20 active:scale-[0.98]',
  outline: 'border border-slate-200 bg-white hover:bg-slate-50/90 hover:border-slate-300 text-slate-700 shadow-xs shadow-slate-900/5 active:scale-[0.98]',
  ghost: 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
  danger: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-md shadow-rose-600/20 active:scale-[0.98]',
  success: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98]',
}

const SIZE_STYLES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon = null,
  rightIcon: RightIcon = null,
  className,
  children,
  ...props
}) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        LeftIcon && <LeftIcon size={size === 'sm' ? 14 : 16} />
      )}
      {children}
      {!loading && RightIcon && <RightIcon size={size === 'sm' ? 14 : 16} />}
    </button>
  )
}

export default Button
