import Breadcrumb from './Breadcrumb'

function PageHeader({ title, description, breadcrumb, actions, badge }) {
  return (
    <div className="mb-5 sm:mb-7 flex flex-col gap-3.5 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        {breadcrumb && (
          <div className="mb-2">
            <Breadcrumb items={breadcrumb} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">{actions}</div>}
    </div>
  )
}

export default PageHeader
