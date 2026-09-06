import { cn } from '../../utils/helpers'

function Card({ title, subtitle, actions, icon: Icon, children, className, bodyClassName, headerClassName }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:shadow-sm',
        className,
      )}
    >
      {(title || actions || subtitle) && (
        <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white px-5 py-3.5", headerClassName)}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/70 shadow-2xs">
                <Icon size={16} />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </div>
  )
}

export default Card
