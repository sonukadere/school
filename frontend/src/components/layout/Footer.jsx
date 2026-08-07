import { useSettings } from '../../context/SettingsContext'

function Footer() {
  const { settings } = useSettings()
  const year = new Date().getFullYear()
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row">
        <p className="text-sm text-slate-500">
          &copy; {year} {settings.schoolName}. All rights reserved.
        </p>
        <p className="text-xs text-slate-400">
          Built with React &amp; Tailwind CSS
        </p>
      </div>
    </footer>
  )
}

export default Footer
