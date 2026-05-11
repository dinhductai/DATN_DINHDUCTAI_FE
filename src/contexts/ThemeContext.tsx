import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface ThemeContextValue {
  darkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  darkMode: false,
  toggleDarkMode: () => {},
})

const STORAGE_KEY = 'darkMode'
const STORAGE_EXPIRY_KEY = 'darkModeExpiry'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function loadDarkModeFromStorage(): boolean {
  try {
    const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY)
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_EXPIRY_KEY)
      return false
    }
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function saveDarkModeToStorage(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
    localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS))
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState<boolean>(() => loadDarkModeFromStorage())

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev
      saveDarkModeToStorage(next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
