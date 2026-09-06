import { useState, useEffect, useRef } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatDate, parseDisplayDate, isValidDate } from '../../utils/helpers'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DateInput({
  label,
  value,
  onChange,
  name,
  id,
  error,
  helper,
  required = false,
  className,
  min,
  max,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
  ...props
}) {
  const inputId = id || name || `date-input-${(label || 'date').toLowerCase().replace(/\s+/g, '-')}`
  const containerRef = useRef(null)

  // Internal display string formatted as DD/MM/YYYY
  const [displayValue, setDisplayValue] = useState(() => {
    if (!value) return ''
    return formatDate(value)
  })

  // Calendar Picker Popup state
  const [showCalendar, setShowCalendar] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => {
    const parsed = parseDisplayDate(value)
    return parsed ? parsed.year : new Date().getFullYear()
  })
  const [pickerMonth, setPickerMonth] = useState(() => {
    const parsed = parseDisplayDate(value)
    return parsed ? parsed.month - 1 : new Date().getMonth()
  })

  // Sync with incoming external value changes
  useEffect(() => {
    if (!value) {
      setDisplayValue('')
      return
    }
    const formatted = formatDate(value)
    setDisplayValue(formatted)
    const parsed = parseDisplayDate(value)
    if (parsed) {
      setPickerYear(parsed.year)
      setPickerMonth(parsed.month - 1)
    }
  }, [value])

  // Close calendar popup on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowCalendar(false)
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCalendar])

  // Handle typing with auto-masking (inserts / after DD and MM)
  const handleInputChange = (e) => {
    let raw = e.target.value.replace(/[^\d/]/g, '')

    // If user deleted a character, don't immediately re-add slash
    if (raw.length === 2 && !displayValue.endsWith('/') && !raw.includes('/')) {
      raw = `${raw}/`
    } else if (raw.length === 5 && displayValue.length < 5 && !raw.slice(3).includes('/')) {
      raw = `${raw}/`
    }

    if (raw.length > 10) raw = raw.slice(0, 10)
    setDisplayValue(raw)

    const parsed = parseDisplayDate(raw)
    if (parsed && parsed.isValid) {
      // Dispatch standard onChange with both ISO and DD/MM/YYYY compatibility
      onChange?.({
        target: {
          name,
          value: parsed.isoString,
          rawValue: parsed.display,
        },
      })
      setPickerYear(parsed.year)
      setPickerMonth(parsed.month - 1)
    } else if (!raw) {
      onChange?.({
        target: {
          name,
          value: '',
          rawValue: '',
        },
      })
    }
  }

  // Handle calendar day click
  const handleSelectDay = (day) => {
    const padD = String(day).padStart(2, '0')
    const padM = String(pickerMonth + 1).padStart(2, '0')
    const formatted = `${padD}/${padM}/${pickerYear}`
    const isoString = `${pickerYear}-${padM}-${padD}`

    setDisplayValue(formatted)
    setShowCalendar(false)

    onChange?.({
      target: {
        name,
        value: isoString,
        rawValue: formatted,
      },
    })
  }

  // Days matrix for current picker month
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(pickerYear, pickerMonth, 1).getDay()

  const handlePrevMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (pickerMonth === 0) {
      setPickerMonth(11)
      setPickerYear((y) => y - 1)
    } else {
      setPickerMonth((m) => m - 1)
    }
  }

  const handleNextMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (pickerMonth === 11) {
      setPickerMonth(0)
      setPickerYear((y) => y + 1)
    } else {
      setPickerMonth((m) => m + 1)
    }
  }

  return (
    <div className="w-full" ref={containerRef}>
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
        <input
          type="text"
          id={inputId}
          name={name}
          disabled={disabled}
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          maxLength={10}
          className={cn(
            'w-full h-11 rounded-xl border bg-slate-50/40 pl-3.5 pr-10 text-sm font-medium text-slate-900 transition-all duration-200',
            'placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10',
            disabled && 'bg-slate-100 text-slate-400 cursor-not-allowed',
            className,
          )}
          {...props}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowCalendar((p) => !p)}
          className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-40"
          title="Open Calendar"
        >
          <Calendar size={18} />
        </button>

        {/* Dropdown Calendar Popup */}
        {showCalendar && !disabled && (
          <div className="absolute top-full left-0 z-50 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            {/* Header: Month & Year Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-xs font-bold text-slate-800">
                {MONTH_NAMES[pickerMonth]} {pickerYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1
                const padD = String(dayNumber).padStart(2, '0')
                const padM = String(pickerMonth + 1).padStart(2, '0')
                const formattedCandidate = `${padD}/${padM}/${pickerYear}`
                const isSelected = displayValue === formattedCandidate

                return (
                  <button
                    key={dayNumber}
                    type="button"
                    onClick={() => handleSelectDay(dayNumber)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg font-medium transition',
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600',
                    )}
                  >
                    {dayNumber}
                  </button>
                )
              })}
            </div>

            {/* Today Button */}
            <div className="mt-3 border-t border-slate-100 pt-2 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Format: DD/MM/YYYY</span>
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  setPickerYear(now.getFullYear())
                  setPickerMonth(now.getMonth())
                  handleSelectDay(now.getDate())
                }}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Today
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      {!error && helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  )
}
