import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

function SearchBar({ value, onChange, placeholder = 'Search...', className, debounceMs = 250 }) {
  const [localValue, setLocalValue] = useState(value || '')
  const timerRef = useRef(null)

  // Keep local input in sync if parent resets or changes value externally
  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleChange = (e) => {
    const nextVal = e.target.value
    setLocalValue(nextVal)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (debounceMs > 0) {
      timerRef.current = setTimeout(() => {
        onChange(nextVal)
      }, debounceMs)
    } else {
      onChange(nextVal)
    }
  }

  const handleClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={`relative w-full sm:w-80 md:w-96 ${className || ''}`}>
      <Search
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pr-9 pl-9 text-sm text-slate-800 transition placeholder:text-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-500/15 focus:outline-none"
        aria-label="Search"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export default SearchBar

