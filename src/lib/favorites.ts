import { FAVORITE_LIMIT, FAVORITE_STORAGE_KEY } from './constants'
import { normalizeRecentQuery } from './recentSearches'
import { hasLocalStorage } from './utils'

export interface FavoriteResult {
  kind: 'result'
  id: string
  name: string
  url: string
  displayUrl?: string
  logo?: string
}

export interface FavoriteQuery {
  kind: 'query'
  id: string
  query: string
}

export type Favorite = FavoriteQuery | FavoriteResult

export const favoriteIdentity = (favorite: Favorite): string => {
  return favorite.kind === 'result' ? `result:${favorite.id}` : `query:${favorite.id}`
}

export const favoriteFromResult = (result: {
  name: string
  url?: string
  displayUrl?: string
  logo?: string
}): FavoriteResult | null => {
  const url = result.url?.trim()

  if (!url) {
    return null
  }

  const displayUrl = result.displayUrl?.trim()
  const logo = result.logo?.trim()

  return {
    kind: 'result',
    id: url,
    name: result.name.trim() || 'Unknown',
    url,
    ...(displayUrl ? { displayUrl } : {}),
    ...(logo ? { logo } : {}),
  }
}

export const favoriteFromQuery = (query: string): FavoriteQuery | null => {
  const normalized = normalizeRecentQuery(query)

  if (!normalized) {
    return null
  }

  return {
    kind: 'query',
    id: normalized.toLowerCase(),
    query: normalized,
  }
}

export const isFavoriteResult = (favorites: readonly Favorite[], url: string): boolean => {
  const id = url.trim()

  return Boolean(id) && favorites.some((item) => item.kind === 'result' && item.id === id)
}

export const isFavoriteQuery = (favorites: readonly Favorite[], query: string): boolean => {
  const id = normalizeRecentQuery(query).toLowerCase()

  return Boolean(id) && favorites.some((item) => item.kind === 'query' && item.id === id)
}

export const toggleFavorite = (
  favorites: readonly Favorite[],
  favorite: Favorite | null,
  max = FAVORITE_LIMIT,
): Favorite[] => {
  if (!favorite) {
    return [...favorites]
  }

  const key = favoriteIdentity(favorite)

  if (favorites.some((item) => favoriteIdentity(item) === key)) {
    return favorites.filter((item) => favoriteIdentity(item) !== key)
  }

  return [favorite, ...favorites].slice(0, max)
}

const parseFavorite = (value: unknown): Favorite | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const item = value as Record<string, unknown>

  if (item.kind === 'result') {
    return favoriteFromResult({
      name: typeof item.name === 'string' ? item.name : '',
      url: typeof item.url === 'string' ? item.url : undefined,
      displayUrl: typeof item.displayUrl === 'string' ? item.displayUrl : undefined,
      logo: typeof item.logo === 'string' ? item.logo : undefined,
    })
  }

  if (item.kind === 'query') {
    return favoriteFromQuery(typeof item.query === 'string' ? item.query : '')
  }

  return null
}

export const parseFavorites = (value: unknown, max = FAVORITE_LIMIT): Favorite[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const next: Favorite[] = []
  const seen = new Set<string>()

  for (const item of value) {
    const favorite = parseFavorite(item)

    if (!favorite) {
      continue
    }

    const key = favoriteIdentity(favorite)

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    next.push(favorite)

    if (next.length >= max) {
      break
    }
  }

  return next
}

export const loadFavorites = (): Favorite[] => {
  if (!hasLocalStorage()) {
    return []
  }

  try {
    const raw = localStorage.getItem(FAVORITE_STORAGE_KEY)

    if (!raw) {
      return []
    }

    return parseFavorites(JSON.parse(raw))
  } catch {
    return []
  }
}

export const saveFavorites = (favorites: readonly Favorite[]): void => {
  if (!hasLocalStorage()) {
    return
  }

  localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(favorites))
}

export const clearFavorites = (): void => {
  if (!hasLocalStorage()) {
    return
  }

  localStorage.removeItem(FAVORITE_STORAGE_KEY)
}
