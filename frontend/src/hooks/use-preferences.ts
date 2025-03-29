import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  showQueryHistory: boolean
  autoSaveQueries: boolean
  maxResultsPerPage: number
}

interface PreferencesStore extends UserPreferences {
  setTheme: (theme: UserPreferences['theme']) => void
  setFontSize: (size: UserPreferences['fontSize']) => void
  setShowQueryHistory: (show: boolean) => void
  setAutoSaveQueries: (autoSave: boolean) => void
  setMaxResultsPerPage: (max: number) => void
  resetPreferences: () => void
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  showQueryHistory: true,
  autoSaveQueries: true,
  maxResultsPerPage: 100,
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setShowQueryHistory: (showQueryHistory) => set({ showQueryHistory }),
      setAutoSaveQueries: (autoSaveQueries) => set({ autoSaveQueries }),
      setMaxResultsPerPage: (maxResultsPerPage) => set({ maxResultsPerPage }),
      resetPreferences: () => set(defaultPreferences),
    }),
    {
      name: 'user-preferences',
    }
  )
) 