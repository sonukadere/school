export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function avatarColor(name = '', palette) {
  const colors = palette || []
  if (!colors.length) return ''
  let sum = 0
  for (let i = 0; i < name.length; i += 1) {
    sum += name.charCodeAt(i)
  }
  return colors[sum % colors.length]
}

export function generateId(prefix) {
  const stamp = Date.now().toString(36).slice(-4).toUpperCase()
  return `${prefix}${stamp}`
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

/**
 * Validate that day, month, year form a valid calendar date.
 * Rejects 32/01/2026, 31/02/2026, 00/12/2026, handles leap years.
 */
export function isValidDate(day, month, year) {
  const d = Number(day)
  const m = Number(month)
  const y = Number(year)
  if (!d || !m || !y) return false
  if (y < 1900 || y > 2100) return false
  if (m < 1 || m > 12) return false
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return d >= 1 && d <= daysInMonth
}

/**
 * Parses a date string (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, or DDMMYYYY) into unambiguous parts.
 * Never relies on ambiguous JavaScript new Date("06/09/2026").
 */
export function parseDisplayDate(str) {
  if (!str) return null
  const trimmed = String(str).trim()
  if (!trimmed) return null

  // Format 1: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (dmMatch) {
    const day = Number(dmMatch[1])
    const month = Number(dmMatch[2])
    const year = Number(dmMatch[3])
    if (!isValidDate(day, month, year)) return null
    const padD = String(day).padStart(2, '0')
    const padM = String(month).padStart(2, '0')
    const isoString = `${year}-${padM}-${padD}`
    return {
      day,
      month,
      year,
      display: `${padD}/${padM}/${year}`,
      isoString,
      dateObj: new Date(Date.UTC(year, month - 1, day)),
      isValid: true,
    }
  }

  // Format 2: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    if (!isValidDate(day, month, year)) return null
    const padD = String(day).padStart(2, '0')
    const padM = String(month).padStart(2, '0')
    return {
      day,
      month,
      year,
      display: `${padD}/${padM}/${year}`,
      isoString: `${year}-${padM}-${padD}`,
      dateObj: new Date(Date.UTC(year, month - 1, day)),
      isValid: true,
    }
  }

  // Format 3: 8 continuous digits DDMMYYYY
  const continuousMatch = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (continuousMatch) {
    const day = Number(continuousMatch[1])
    const month = Number(continuousMatch[2])
    const year = Number(continuousMatch[3])
    if (isValidDate(day, month, year)) {
      const padD = String(day).padStart(2, '0')
      const padM = String(month).padStart(2, '0')
      return {
        day,
        month,
        year,
        display: `${padD}/${padM}/${year}`,
        isoString: `${year}-${padM}-${padD}`,
        dateObj: new Date(Date.UTC(year, month - 1, day)),
        isValid: true,
      }
    }
  }

  // Fallback for Date objects or full ISO strings (e.g. 2026-09-07T00:00:00.000Z)
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return null
  const day = d.getUTCDate()
  const month = d.getUTCMonth() + 1
  const year = d.getUTCFullYear()
  if (!isValidDate(day, month, year)) return null
  const padD = String(day).padStart(2, '0')
  const padM = String(month).padStart(2, '0')
  return {
    day,
    month,
    year,
    display: `${padD}/${padM}/${year}`,
    isoString: `${year}-${padM}-${padD}`,
    dateObj: d,
    isValid: true,
  }
}

/**
 * Format date for input field without returning placeholder dash '—'.
 * Returns empty string if invalid or empty.
 */
export function formatDateForInput(dateInput) {
  if (!dateInput) return ''
  const parsed = parseDisplayDate(dateInput)
  return parsed ? parsed.display : ''
}

/**
 * Converts any valid date input to YYYY-MM-DD.
 */
export function toISODateString(dateInput) {
  if (!dateInput) return ''
  const parsed = parseDisplayDate(dateInput)
  return parsed ? parsed.isoString : ''
}

/**
 * Detailed validation for user-typed dates.
 * Rejects 31/02/2026, 31/04/2026, checks leap years, min, and max.
 * Returns { isValid, error, isoString, display }
 */
export function validateDateString(str, min, max) {
  if (!str || !String(str).trim()) {
    return { isValid: false, error: 'Date is required', isoString: null, display: null }
  }

  const trimmed = String(str).trim()

  // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const partsMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (!partsMatch) {
    // Check if it's in YYYY-MM-DD format
    const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
    if (isoMatch) {
      const year = Number(isoMatch[1])
      const month = Number(isoMatch[2])
      const day = Number(isoMatch[3])
      if (!isValidDate(day, month, year)) {
        return { isValid: false, error: 'Invalid calendar date', isoString: null, display: null }
      }
      const padD = String(day).padStart(2, '0')
      const padM = String(month).padStart(2, '0')
      const isoString = `${year}-${padM}-${padD}`
      const display = `${padD}/${padM}/${year}`

      if (min) {
        const minIso = toISODateString(min)
        if (minIso && isoString < minIso) {
          return { isValid: false, error: `Date cannot be earlier than ${formatDate(min)}`, isoString, display }
        }
      }
      if (max) {
        const maxIso = toISODateString(max)
        if (maxIso && isoString > maxIso) {
          return { isValid: false, error: `Date cannot be later than ${formatDate(max)}`, isoString, display }
        }
      }
      return { isValid: true, error: null, isoString, display }
    }

    return { isValid: false, error: 'Please enter date in DD/MM/YYYY format', isoString: null, display: null }
  }

  const day = Number(partsMatch[1])
  const month = Number(partsMatch[2])
  const year = Number(partsMatch[3])

  if (year < 1920 || year > 2050) {
    return { isValid: false, error: 'Year must be between 1920 and 2050', isoString: null, display: null }
  }
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Month must be between 01 and 12', isoString: null, display: null }
  }

  // Days in month check
  const maxDays = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day < 1 || day > maxDays) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const mName = monthNames[month - 1] || 'month'
    return {
      isValid: false,
      error: `Invalid date (${mName} has ${maxDays} days in ${year})`,
      isoString: null,
      display: null,
    }
  }

  const padD = String(day).padStart(2, '0')
  const padM = String(month).padStart(2, '0')
  const isoString = `${year}-${padM}-${padD}`
  const display = `${padD}/${padM}/${year}`

  if (min) {
    const minIso = toISODateString(min)
    if (minIso && isoString < minIso) {
      return { isValid: false, error: `Date cannot be earlier than ${formatDate(min)}`, isoString, display }
    }
  }
  if (max) {
    const maxIso = toISODateString(max)
    if (maxIso && isoString > maxIso) {
      return { isValid: false, error: `Date cannot be later than ${formatDate(max)}`, isoString, display }
    }
  }

  return { isValid: true, error: null, isoString, display }
}

/**
 * Format any date input strictly as DD/MM/YYYY.
 * Example: 2026-09-06 -> 06/09/2026
 * Timezone-safe: never shifts dates across timezones.
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—'

  // If already in DD/MM/YYYY format, validate and return
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim()
    const match = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
    if (match) {
      const d = match[1].padStart(2, '0')
      const m = match[2].padStart(2, '0')
      const y = match[3]
      return `${d}/${m}/${y}`
    }
    // If string matches YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
    if (isoMatch) {
      const y = isoMatch[1]
      const m = isoMatch[2].padStart(2, '0')
      const d = isoMatch[3].padStart(2, '0')
      return `${d}/${m}/${y}`
    }
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) return String(dateInput)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format date-time as DD/MM/YYYY, hh:mm A
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—'
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) return formatDate(dateInput)

  const datePart = formatDate(date)
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12 // 0 should be 12
  const formattedHours = String(hours).padStart(2, '0')

  return `${datePart}, ${formattedHours}:${minutes} ${ampm}`
}

export function todayISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayDDMMYYYY() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${d}/${m}/${y}`
}

export function gradeFromPercentage(percentage) {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-600' }
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
  if (percentage >= 70) return { grade: 'B', color: 'text-sky-600' }
  if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
  if (percentage >= 50) return { grade: 'D', color: 'text-orange-600' }
  return { grade: 'F', color: 'text-rose-600' }
}

export function percentage(obtained, max) {
  if (!max) return 0
  return Math.round((obtained / max) * 100)
}

export const STATUS_STYLES = {
  Present: 'bg-emerald-100 text-emerald-700',
  Absent: 'bg-rose-100 text-rose-700',
  Leave: 'bg-amber-100 text-amber-700',
  Paid: 'bg-emerald-100 text-emerald-700',
  Partial: 'bg-amber-100 text-amber-700',
  Pending: 'bg-slate-100 text-slate-600',
  Overdue: 'bg-rose-100 text-rose-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Inactive: 'bg-slate-100 text-slate-600',
  High: 'bg-rose-100 text-rose-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-sky-100 text-sky-700',
  Male: 'bg-sky-100 text-sky-700',
  Female: 'bg-rose-100 text-rose-700',
  Other: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-purple-100 text-purple-700',
}
