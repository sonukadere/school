import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/helpers'

function Select({
  label,
  options,
  error,
  required = false,
  placeholder = 'Select an option',
  className,
  id,
  ...props
}) {
  const selectId = id || props.name || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full h-11 cursor-pointer appearance-none rounded-xl border bg-slate-50/40 px-3.5 pr-10 text-sm text-slate-900 transition-all duration-200',
            'focus:bg-white focus:outline-none focus:ring-4',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10',
            !props.value && 'text-slate-400',
            className,
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => {
            const value = typeof option === 'object' ? option.value : option
            const labelText = typeof option === 'object' ? option.label : option
            return (
              <option key={value} value={value}>
                {labelText}
              </option>
            )
          })}
        </select>
        <ChevronDown
          size={18}
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400"
        />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export default Select
