import { cn } from '../../utils/helpers'

function Card({ title, subtitle, actions, icon: Icon, children, className, bodyClassName, headerClassName }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_6px_24px_0_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_2px_6px_0_rgba(0,0,0,0.04),0_12px_32px_0_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      {(title || actions || subtitle) && (
        <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/90 bg-gradient-to-r from-slate-50/60 to-transparent px-6 py-4.5", headerClassName)}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-500/10">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-6', bodyClassName)}>{children}</div>
    </div>
  )
}

export default Card
