import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { api } from '../services/api'

const SettingsContext = createContext(null)

const DEFAULT_SETTINGS = {
  schoolName: 'Daily Day Academy',
  schoolLogo: '',
  address: '123 Education Street, New Delhi - 110001',
  contactNumber: '+91 98765 43210',
  phone: '+91 98765 43210',
  email: 'info@dailydayacademy.edu',
  academicYear: '2026-2027',
  currency: '₹',
  timetableStartTime: '08:00',
  timetableEndTime: '14:00',
  periodDuration: 45,
  totalPeriods: 7,
  breakStartTime: '10:15',
  breakEndTime: '10:30',
  workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
}

export function SettingsProvider({ children }) {
  const [localSettings, setLocalSettings] = useLocalStorage('sms_settings', DEFAULT_SETTINGS)
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...localSettings,
    schoolName: localSettings?.schoolName || 'Daily Day Academy',
  }))

  // Sync settings from backend on mount
  useEffect(() => {
    let isMounted = true
    const fetchRemoteSettings = async () => {
      try {
        const remote = await api.getSettings()
        if (isMounted && remote) {
          const merged = {
            ...DEFAULT_SETTINGS,
            ...remote,
            contactNumber: remote.phone || remote.contactNumber || DEFAULT_SETTINGS.contactNumber,
            workingDays: remote.workingDays?.length ? remote.workingDays : DEFAULT_SETTINGS.workingDays,
          }
          setSettings(merged)
          setLocalSettings(merged)
        }
      } catch {
        // Use local cached fallback
      }
    }

    fetchRemoteSettings()
    return () => {
      isMounted = false
    }
  }, [setLocalSettings])

  const updateSettings = useCallback(async (updates) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    setLocalSettings(next)

    try {
      await api.updateSettings({
        schoolName: next.schoolName,
        schoolLogo: next.schoolLogo || null,
        address: next.address || null,
        phone: next.phone || next.contactNumber || null,
        email: next.email || null,
        academicYear: next.academicYear || null,
        timetableStartTime: next.timetableStartTime,
        timetableEndTime: next.timetableEndTime,
        periodDuration: next.periodDuration,
        totalPeriods: next.totalPeriods,
        breakStartTime: next.breakStartTime,
        breakEndTime: next.breakEndTime,
        workingDays: next.workingDays,
      })
    } catch (err) {
      console.warn('[SettingsContext] Failed to persist settings to backend:', err.message)
    }
  }, [settings, setLocalSettings])

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS)
    setLocalSettings(DEFAULT_SETTINGS)
    try {
      await api.updateSettings(DEFAULT_SETTINGS)
    } catch {
      // Ignore
    }
  }, [setLocalSettings])

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

export default SettingsContext
