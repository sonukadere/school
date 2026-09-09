import { useState } from 'react'

/**
 * Custom hook to store state in tab-isolated sessionStorage.
 * Unlike localStorage, sessionStorage is unique per browser tab,
 * allowing different tabs to be logged in with different users/roles
 * without colliding or overwriting each other on page refresh.
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialValue

      // 1. Check tab-isolated sessionStorage first
      const item = window.sessionStorage.getItem(key)
      if (item !== null) {
        return JSON.parse(item)
      }

      // 2. Migration fallback: check localStorage for existing session
      const localItem = window.localStorage.getItem(key)
      if (localItem !== null) {
        window.sessionStorage.setItem(key, localItem)
        window.localStorage.removeItem(key)
        return JSON.parse(localItem)
      }

      return initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      if (typeof window === 'undefined') return
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (valueToStore === null || valueToStore === undefined) {
        window.sessionStorage.removeItem(key)
        window.localStorage.removeItem(key)
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
        // Remove from localStorage to prevent cross-tab session overwrite
        window.localStorage.removeItem(key)
      }
    } catch {
      setStoredValue(value)
    }
  }

  return [storedValue, setValue]
}
