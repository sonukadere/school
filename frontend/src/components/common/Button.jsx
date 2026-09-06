import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/helpers'

const VARIANT_STYLES = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow hover:shadow-indigo-500/20 border border-indigo-500/20 active:scale-[0.98]',
  secondary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow active:scale-[0.98]',
  outline: 'border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-2xs active:scale-[0.98]',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow hover:shadow-rose-600/20 active:scale-[0.98]',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow hover:shadow-emerald-600/20 active:scale-[0.98]',
}

const SIZE_STYLES = {
  sm: 'h-8 px-3 text-xs font-medium',
  md: 'h-9.5 px-3.5 text-sm font-medium',
  lg: 'h-11 px-5 text-base font-medium',
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
