import { RECENT_SEARCH_LIMIT, RECENT_SEARCH_STORAGE_KEY } from './constants'
import { hasLocalStorage } from './utils'

export const normalizeRecentQuery = (query: string): string => {
  return query.trim().replace(/\s+/g, ' ')
}

export const upsertRecentSearch = (
  recents: readonly string[],
  query: string,
  max = RECENT_SEARCH_LIMIT,
): string[] => {
  const next = normalizeRecentQuery(query)

  if (!next) {
    return [...recents]
  }

  const lower = next.toLowerCase()

  return [next, ...recents.filter((item) => item.toLowerCase() !== lower)].slice(0, max)
}

export const loadRecentSearches = (): string[] => {
  if (!hasLocalStorage()) {
    return []
  }

  try {
    const raw = localStorage.getItem(RECENT_SEARCH_STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map(normalizeRecentQuery)
      .filter(Boolean)
      .slice(0, RECENT_SEARCH_LIMIT)
  } catch {
    return []
  }
}

export const saveRecentSearches = (recents: readonly string[]): void => {
  if (!hasLocalStorage()) {
    return
  }

  localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify(recents))
}

export const clearRecentSearches = (): void => {
  if (!hasLocalStorage()) {
    return
  }

  localStorage.removeItem(RECENT_SEARCH_STORAGE_KEY)
}
