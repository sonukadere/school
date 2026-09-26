import { useAppConfig } from '../context/AppConfigContext'

const modules = import.meta.glob('./slices/*.js', { eager: true })

const hi = Object.assign({}, ...Object.values(modules).map((mod) => mod.hi ?? {}))

export function useTranslation() {
  const { language } = useAppConfig()
  const t = (key) => (language === 'hi' ? hi[key] ?? key : key)
  return { t, language }
}

export default useTranslation