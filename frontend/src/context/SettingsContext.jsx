import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const SettingsContext = createContext(null)

const DEFAULT_SETTINGS = {
  schoolName: 'EduManage High School',
  schoolLogo: '',
  address: '123 Education Street, New Delhi - 110001',
  contactNumber: '+91 98765 43210',
  email: 'info@edumanage.edu',
  academicYear: '2026-2027',
  currency: '$',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useLocalStorage('sms_settings', DEFAULT_SETTINGS)

  const updateSettings = (updates) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}
