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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
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
}
