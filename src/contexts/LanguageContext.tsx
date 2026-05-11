import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations, type TranslationKey } from '../i18n/translations'

export type Language = 'VIE' | 'ENG'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'VIE',
  setLanguage: () => {},
})

const STORAGE_KEY = 'language'
const STORAGE_EXPIRY_KEY = 'languageExpiry'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function loadLanguageFromStorage(): Language {
  try {
    const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY)
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_EXPIRY_KEY)
      return 'VIE'
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'ENG' ? 'ENG' : 'VIE'
  } catch {
    return 'VIE'
  }
}

function saveLanguageToStorage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
    localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS))
  } catch {
    // ignore
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => loadLanguageFromStorage())

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    saveLanguageToStorage(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function useTranslation() {
  const { language } = useLanguage()
  const t = (key: TranslationKey): string => translations[language][key]
  return { t, language }
}
