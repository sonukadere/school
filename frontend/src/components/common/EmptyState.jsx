import { Inbox } from 'lucide-react'
import Button from './Button'
import { useTranslation } from '../../i18n'

function EmptyState({ title = 'No data found', description, actionLabel, onAction, icon: Icon = Inbox }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800">{t(title)}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{t(description)}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" className="mt-5" onClick={onAction}>
          {t(actionLabel)}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
