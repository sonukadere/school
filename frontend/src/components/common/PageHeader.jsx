import Breadcrumb from './Breadcrumb'

function PageHeader({ title, description, breadcrumb, actions, badge }) {
  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        {breadcrumb && (
          <div className="mb-2.5">
            <Breadcrumb items={breadcrumb} />
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && <p className="mt-1.5 text-sm text-slate-500 font-normal leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

export default PageHeader
