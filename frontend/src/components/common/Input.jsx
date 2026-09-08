import { cn } from '../../utils/helpers'
import DateInput from './DateInput'

function Input({
  label,
  error,
  helper,
  required = false,
  icon: Icon = null,
  className,
  id,
  type = 'text',
  ...props
}) {
  if (type === 'date') {
    return (
      <DateInput
        label={label}
        error={error}
        helper={helper}
        required={required}
        className={className}
        id={id}
        {...props}
      />
    )
  }
  const inputId =
    id ||
    props.name ||
    (typeof label === 'string' ? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)

  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || (typeof error === 'object' && error !== null ? JSON.stringify(error) : '')

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
          type={type}
          className={cn(
            'w-full h-11 rounded-xl border bg-slate-50/40 px-3.5 text-sm text-slate-900 transition-all duration-200',
            'placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4',
            Icon ? 'pl-10' : '',
            errorMessage
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10',
            className,
          )}
          aria-invalid={Boolean(errorMessage)}
          {...props}
          value={props.value ?? ''}
        />
      </div>
      {errorMessage && <p className="mt-1 text-xs font-medium text-rose-600">{errorMessage}</p>}
      {!errorMessage && helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  )
}

export default Input
