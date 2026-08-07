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
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 transition-colors',
            'placeholder:text-slate-400 focus:outline-none focus:ring-2',
            Icon ? 'py-2.5 pl-10' : 'py-2.5',
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100',
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
