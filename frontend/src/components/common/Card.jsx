import { cn } from '../../utils/helpers'

function Card({ title, subtitle, actions, children, className, bodyClassName }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-6px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </div>
  )
}

export default Card
