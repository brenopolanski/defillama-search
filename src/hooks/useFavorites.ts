import { useCallback, useState } from 'react'

import type { Favorite } from '@/lib/favorites'
import {
  clearFavorites as clearStoredFavorites,
  favoriteFromQuery,
  favoriteFromResult,
  isFavoriteQuery,
  isFavoriteResult,
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from '@/lib/favorites'
import type { SearchResult } from '@/lib/search/types'

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>(() => loadFavorites())

  const isResultPinned = useCallback(
    (url: string) => {
      return isFavoriteResult(favorites, url)
    },
    [favorites],
  )

  const isQueryPinned = useCallback(
    (query: string) => {
      return isFavoriteQuery(favorites, query)
    },
    [favorites],
  )

  const toggleResult = useCallback((result: SearchResult) => {
    setFavorites((current) => {
      const next = toggleFavorite(current, favoriteFromResult(result))

      saveFavorites(next)

      return next
    })
  }, [])

  const toggleQuery = useCallback((query: string) => {
    setFavorites((current) => {
      const next = toggleFavorite(current, favoriteFromQuery(query))

      saveFavorites(next)

      return next
    })
  }, [])

  const clearFavorites = useCallback(() => {
    clearStoredFavorites()
    setFavorites([])
  }, [])

  return { favorites, isResultPinned, isQueryPinned, toggleResult, toggleQuery, clearFavorites }
}
