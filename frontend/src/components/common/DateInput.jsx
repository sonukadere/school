import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Check,
} from 'lucide-react'
import {
  cn,
  formatDateForInput,
  parseDisplayDate,
  toISODateString,
  validateDateString,
  formatDate,
} from '../../utils/helpers'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
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
  const inputId =
    id ||
    name ||
    (typeof label === 'string'
      ? `date-input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      : 'date-input')
  const containerRef = useRef(null)
  const nativeInputRef = useRef(null)
  const isBackspaceRef = useRef(false)

  // Internal validation error state for typed input
  const [internalError, setInternalError] = useState('')
  const rawError = error || internalError
  const activeError =
    typeof rawError === 'string'
      ? rawError
      : rawError?.message || (typeof rawError === 'object' && rawError !== null ? JSON.stringify(rawError) : '')

  // Internal display string formatted as DD/MM/YYYY
  const [displayValue, setDisplayValue] = useState(() => {
    if (!value) return ''
    return formatDateForInput(value)
  })

  // Calendar Picker Popup state
  const [showCalendar, setShowCalendar] = useState(false)
  const [alignRight, setAlignRight] = useState(false)

  const initialParsed = useMemo(() => parseDisplayDate(value), [value])
  const [pickerYear, setPickerYear] = useState(() => {
    return initialParsed ? initialParsed.year : new Date().getFullYear()
  })
  const [pickerMonth, setPickerMonth] = useState(() => {
    return initialParsed ? initialParsed.month - 1 : new Date().getMonth()
  })

  // Generate a broad range of years for fast 1-click selection (1930 to 2040)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const startYear = Math.max(currentYear + 10, 2035)
    const endYear = 1930
    const years = []
    for (let y = startYear; y >= endYear; y--) {
      years.push(y)
    }
    return years
  }, [])

  // Sync with incoming external value changes
  useEffect(() => {
    if (!value) {
      setDisplayValue('')
      return
    }
    const formatted = formatDateForInput(value)
    setDisplayValue(formatted)
    const parsed = parseDisplayDate(value)
    if (parsed && parsed.isValid) {
      setPickerYear(parsed.year)
      setPickerMonth(parsed.month - 1)
      setInternalError('')
    }
  }, [value])

  // Check positioning on popup open
  useEffect(() => {
    if (showCalendar && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.left + 320 > window.innerWidth) {
        setAlignRight(true)
      } else {
        setAlignRight(false)
      }
    }
  }, [showCalendar])

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

  // Check if a specific date candidate is disabled by min/max
  const isDateDisabled = (year, monthIndex, dayNumber) => {
    const padD = String(dayNumber).padStart(2, '0')
    const padM = String(monthIndex + 1).padStart(2, '0')
    const candidateIso = `${year}-${padM}-${padD}`
    const minIso = toISODateString(min)
    const maxIso = toISODateString(max)
    if (minIso && candidateIso < minIso) return true
    if (maxIso && candidateIso > maxIso) return true
    return false
  }

  // Handle keydown for backspace & escape
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      isBackspaceRef.current = true
    } else {
      isBackspaceRef.current = false
    }
    if (e.key === 'Escape') {
      setShowCalendar(false)
    }
  }

  // Handle typing with smart auto-formatting and live validation
  const handleInputChange = (e) => {
    const raw = e.target.value
    const wasBackspace = isBackspaceRef.current

    if (!raw.trim()) {
      setDisplayValue('')
      setInternalError(required ? 'Date is required' : '')
      onChange?.({
        target: {
          name,
          value: '',
          rawValue: '',
        },
      })
      return
    }

    let formatted = raw
    if (!wasBackspace) {
      const digitsOnly = raw.replace(/\D/g, '').slice(0, 8)
      if (digitsOnly.length >= 5) {
        formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`
      } else if (digitsOnly.length >= 3) {
        formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`
      } else if (digitsOnly.length === 2 && digitsOnly.length > displayValue.replace(/\D/g, '').length) {
        formatted = `${digitsOnly}/`
      } else {
        formatted = digitsOnly
      }
    }

    if (formatted.length > 10) formatted = formatted.slice(0, 10)
    setDisplayValue(formatted)

    if (formatted.length === 10) {
      const validation = validateDateString(formatted, min, max)
      if (validation.isValid) {
        setInternalError('')
        onChange?.({
          target: {
            name,
            value: validation.isoString,
            rawValue: validation.display,
          },
        })
        const parsed = parseDisplayDate(formatted)
        if (parsed) {
          setPickerYear(parsed.year)
          setPickerMonth(parsed.month - 1)
        }
      } else {
        setInternalError(validation.error)
        onChange?.({
          target: {
            name,
            value: '',
            rawValue: formatted,
          },
        })
      }
    } else {
      // Clear error while typing before 10 characters
      setInternalError('')
    }
  }

  // Handle paste of any standard date format
  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text')
    const validation = validateDateString(text, min, max)
    if (validation.isValid) {
      e.preventDefault()
      setInternalError('')
      setDisplayValue(validation.display)
      onChange?.({
        target: {
          name,
          value: validation.isoString,
          rawValue: validation.display,
        },
      })
      const parsed = parseDisplayDate(validation.display)
      if (parsed) {
        setPickerYear(parsed.year)
        setPickerMonth(parsed.month - 1)
      }
    }
  }

  // Handle blur to validate and reconcile
  const handleBlur = (e) => {
    props.onBlur?.(e)
    if (!displayValue.trim()) {
      if (required) setInternalError('Date is required')
      if (value) {
        onChange?.({
          target: { name, value: '', rawValue: '' },
        })
      }
      return
    }

    const validation = validateDateString(displayValue, min, max)
    if (validation.isValid) {
      setInternalError('')
      setDisplayValue(validation.display)
      if (value !== validation.isoString) {
        onChange?.({
          target: { name, value: validation.isoString, rawValue: validation.display },
        })
      }
    } else {
      setInternalError(validation.error)
      onChange?.({
        target: { name, value: '', rawValue: displayValue },
      })
    }
  }

  // Handle calendar day click (syncs both display and form value)
  const handleSelectDay = (day, monthIndex = pickerMonth, year = pickerYear) => {
    if (isDateDisabled(year, monthIndex, day)) return

    const padD = String(day).padStart(2, '0')
    const padM = String(monthIndex + 1).padStart(2, '0')
    const formatted = `${padD}/${padM}/${year}`
    const isoString = `${year}-${padM}-${padD}`

    setInternalError('')
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

  // Handle Today selection
  const handleSelectToday = () => {
    setInternalError('')
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const d = now.getDate()
    setPickerYear(y)
    setPickerMonth(m)
    handleSelectDay(d, m, y)
  }

  // Handle Clear
  const handleClear = () => {
    setInternalError(required ? 'Date is required' : '')
    setDisplayValue('')
    setShowCalendar(false)
    onChange?.({
      target: {
        name,
        value: '',
        rawValue: '',
      },
    })
  }

  // Navigation handlers
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

  const handlePrevYear = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setPickerYear((y) => y - 1)
  }

  const handleNextYear = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setPickerYear((y) => y + 1)
  }

  // Sync native input when chosen
  const handleNativeChange = (e) => {
    const isoVal = e.target.value
    if (!isoVal) return
    const validation = validateDateString(isoVal, min, max)
    if (validation.isValid) {
      setInternalError('')
      setDisplayValue(validation.display)
      onChange?.({
        target: {
          name,
          value: validation.isoString,
          rawValue: validation.display,
        },
      })
      const parsed = parseDisplayDate(validation.display)
      if (parsed) {
        setPickerYear(parsed.year)
        setPickerMonth(parsed.month - 1)
      }
      setShowCalendar(false)
    }
  }

  // Days matrix for current picker month
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(pickerYear, pickerMonth, 1).getDay()

  const today = new Date()
  const isCurrentMonthToday =
    today.getFullYear() === pickerYear && today.getMonth() === pickerMonth
  const todayDateNumber = today.getDate()

  return (
    <div className="w-full relative" ref={containerRef}>
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
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          inputMode="numeric"
          placeholder={placeholder}
          maxLength={10}
          className={cn(
            'w-full h-11 rounded-xl border bg-slate-50/40 pl-3.5 pr-11 text-sm font-medium text-slate-900 transition-all duration-200',
            'placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4',
            activeError
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10',
            disabled && 'bg-slate-100 text-slate-400 cursor-not-allowed',
            className,
          )}
          aria-invalid={Boolean(activeError)}
          {...props}
        />

        {/* Hidden Native Input for quick browser / mobile wheel integration */}
        <input
          type="date"
          ref={nativeInputRef}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none absolute"
          value={toISODateString(value) || ''}
          min={toISODateString(min) || undefined}
          max={toISODateString(max) || undefined}
          onChange={handleNativeChange}
        />

        {/* Calendar Trigger Icon Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setShowCalendar((prev) => !prev)
          }}
          className={cn(
            'absolute top-1/2 right-2.5 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 transition-colors',
            'hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
            showCalendar && 'bg-indigo-50 text-indigo-600',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
          title="Open Calendar Date Picker"
          aria-label="Open Calendar"
        >
          <Calendar size={18} />
        </button>

        {/* Enhanced Calendar Popup */}
        {showCalendar && !disabled && (
          <div
            className={cn(
              'absolute top-full z-[100] mt-1.5 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150',
              alignRight ? 'right-0' : 'left-0',
            )}
          >
            {/* Header: Fast Month & Year Selector with Jump Controls */}
            <div className="flex items-center justify-between gap-1 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Previous Year"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* Month Dropdown & Year Dropdown for 1-Click Jumping */}
              <div className="flex items-center gap-1.5">
                <select
                  value={pickerMonth}
                  onChange={(e) => setPickerMonth(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-slate-50/70 px-2 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {MONTH_NAMES.map((monthName, idx) => (
                    <option key={monthName} value={idx}>
                      {monthName}
                    </option>
                  ))}
                </select>

                <select
                  value={pickerYear}
                  onChange={(e) => setPickerYear(Number(e.target.value))}
                  className="h-8 rounded-lg border border-slate-200 bg-slate-50/70 px-2 text-xs font-semibold text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextYear}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Next Year"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="mt-2.5 grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mt-1">
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-8 w-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1
                const padD = String(dayNumber).padStart(2, '0')
                const padM = String(pickerMonth + 1).padStart(2, '0')
                const candidateDisplay = `${padD}/${padM}/${pickerYear}`
                const isSelected = displayValue === candidateDisplay
                const isToday = isCurrentMonthToday && todayDateNumber === dayNumber
                const disabledDate = isDateDisabled(pickerYear, pickerMonth, dayNumber)

                return (
                  <button
                    key={dayNumber}
                    type="button"
                    disabled={disabledDate}
                    onClick={() => handleSelectDay(dayNumber)}
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all duration-150',
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-2 ring-indigo-600/30'
                        : isToday
                        ? 'border border-indigo-500 font-bold text-indigo-600 hover:bg-indigo-50'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600',
                      disabledDate && 'opacity-25 cursor-not-allowed hover:bg-transparent hover:text-slate-700',
                    )}
                  >
                    {dayNumber}
                  </button>
                )
              })}
            </div>

            {/* Footer Action Buttons: Today, Clear & Device Picker */}
            <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                >
                  <Check size={13} />
                  Today
                </button>
                {displayValue && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1"
                  >
                    <X size={13} />
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {nativeInputRef.current?.showPicker && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        nativeInputRef.current?.showPicker()
                      } catch {
                        // ignore if showPicker is not permitted
                      }
                    }}
                    className="text-[11px] font-medium text-slate-400 hover:text-indigo-600"
                  >
                    Native Picker
                  </button>
                )}
                <span className="text-[10px] text-slate-400 font-mono">DD/MM/YYYY</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeError && <p className="mt-1 text-xs font-medium text-rose-600">{activeError}</p>}
      {!activeError && helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  )
}
