import { Search, X } from 'lucide-react'

function SearchBar({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={`relative w-full sm:w-72 ${className || ''}`}>
      <Search
        size={18}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-10 pl-10 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
        aria-label="Search"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-600"
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}

export default SearchBar
