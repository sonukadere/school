import { useSettings } from '../../context/SettingsContext'
import { useTranslation } from '../../i18n'

function Footer() {
  const { settings } = useSettings()
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row">
        <p className="text-sm text-slate-600">
          &copy; {year} {settings.schoolName}. {t('All Rights Reserved.')}
        </p>
        <p className="text-xs text-slate-600 font-medium">
          {t('Built with React & Tailwind CSS')}
        </p>
      </div>
    </footer>
  )
}

export default Footer
