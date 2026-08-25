import { useCallback, useState } from 'react'

import {
  clearRecentSearches,
  loadRecentSearches,
  saveRecentSearches,
  upsertRecentSearch,
} from '@/lib/recentSearches'

export const useRecentSearches = () => {
  const [recents, setRecents] = useState<string[]>(() => loadRecentSearches())

  const addRecent = useCallback((query: string) => {
    setRecents((current) => {
      const next = upsertRecentSearch(current, query)

      saveRecentSearches(next)

      return next
    })
  }, [])

  const clearRecents = useCallback(() => {
    clearRecentSearches()
    setRecents([])
  }, [])

  return { recents, addRecent, clearRecents }
}
