import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/helpers'

function Loader({ label = 'Loading...', fullScreen = false, className }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-100/80 backdrop-blur-sm">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <Loader2 size={32} className="animate-spin text-indigo-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  )
}

export default Loader
