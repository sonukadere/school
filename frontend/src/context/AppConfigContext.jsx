import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppConfigContext = createContext(null)

const STORAGE_KEY = 'sms_app_config'

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {}
}

export function AppConfigProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = readStored()
    return stored.theme === 'dark' ? 'dark' : 'light'
  })
  const [language, setLanguage] = useState(() => {
    const stored = readStored()
    return stored.language === 'hi' ? 'hi' : 'en'
  })

  useEffect(() => {
    const root = document.documentElement
    const isDark = theme === 'dark'
    root.classList.toggle('dark', isDark)
    document.body.style.background = isDark ? '#0b1220' : ''
  }, [theme])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, language }))
    } catch {
      // ignore
    }
  }, [theme, language])

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  const switchLanguage = (lang) => setLanguage(lang === 'hi' ? 'hi' : 'en')

  const contextValue = useMemo(
    () => ({ theme, language, toggleTheme, setLanguage: switchLanguage, isDark: theme === 'dark' }),
    [theme, language]
  )

  return <AppConfigContext.Provider value={contextValue}>{children}</AppConfigContext.Provider>
}

export function useAppConfig() {
  const context = useContext(AppConfigContext)
  if (!context) throw new Error('useAppConfig must be used within AppConfigProvider')
  return context
}

export default AppConfigContext