import { cn } from '../../utils/helpers'

function Input({
  label,
  error,
  helper,
  required = false,
  icon: Icon = null,
  className,
  id,
  ...props
}) {
  const inputId = id || props.name || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          id={inputId}
          className={cn(
            'w-full h-11 rounded-xl border bg-slate-50/40 px-3.5 text-sm text-slate-900 transition-all duration-200',
            'placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4',
            Icon ? 'pl-10' : '',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      {!error && helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  )
}

export default Input
