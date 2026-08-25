import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FAVORITE_STORAGE_KEY } from './constants'
import type { Favorite } from './favorites'
import {
  favoriteFromQuery,
  favoriteFromResult,
  isFavoriteQuery,
  isFavoriteResult,
  loadFavorites,
  parseFavorites,
  saveFavorites,
  toggleFavorite,
} from './favorites'

const result = (url: string, name = 'Uniswap'): Favorite => ({
  kind: 'result',
  id: url,
  name,
  url,
  displayUrl: 'uniswap.org',
  logo: 'https://icons.example/uni.png',
})

const query = (value: string): Favorite => ({
  kind: 'query',
  id: value.toLowerCase(),
  query: value,
})

describe('favoriteFromResult', () => {
  it('uses the URL as the stable id and drops blank optional fields', () => {
    expect(
      favoriteFromResult({
        name: '  Uniswap  ',
        url: '  https://uniswap.org/  ',
        displayUrl: '  ',
        logo: '',
      }),
    ).toEqual({
      kind: 'result',
      id: 'https://uniswap.org/',
      name: 'Uniswap',
      url: 'https://uniswap.org/',
    })
  })

  it('returns null when the result has no URL', () => {
    expect(favoriteFromResult({ name: 'Unknown' })).toBeNull()
    expect(favoriteFromResult({ name: 'Unknown', url: '   ' })).toBeNull()
  })
})

describe('favoriteFromQuery', () => {
  it('normalizes whitespace and lowercases the identity', () => {
    expect(favoriteFromQuery('  Uni   Swap  ')).toEqual({
      kind: 'query',
      id: 'uni swap',
      query: 'Uni Swap',
    })
  })

  it('returns null for blank queries', () => {
    expect(favoriteFromQuery('   ')).toBeNull()
  })
})

describe('isFavoriteResult / isFavoriteQuery', () => {
  const favorites = [result('https://uniswap.org/'), query('Aave')]

  it('matches results by exact URL', () => {
    expect(isFavoriteResult(favorites, 'https://uniswap.org/')).toBe(true)
    expect(isFavoriteResult(favorites, 'https://aave.com/')).toBe(false)
  })

  it('matches queries case-insensitively', () => {
    expect(isFavoriteQuery(favorites, '  aave  ')).toBe(true)
    expect(isFavoriteQuery(favorites, 'compound')).toBe(false)
  })
})

describe('toggleFavorite', () => {
  it('pins a result at the front', () => {
    expect(toggleFavorite([query('aave')], result('https://uniswap.org/'))).toEqual([
      result('https://uniswap.org/'),
      query('aave'),
    ])
  })

  it('unpins a result with the same URL', () => {
    expect(
      toggleFavorite(
        [result('https://uniswap.org/', 'Uni'), query('aave')],
        result('https://uniswap.org/', 'Uniswap'),
      ),
    ).toEqual([query('aave')])
  })

  it('pins a query at the front and unpins case-insensitively', () => {
    const pinned = toggleFavorite([result('https://uniswap.org/')], query('Aave'))

    expect(pinned).toEqual([query('Aave'), result('https://uniswap.org/')])
    expect(toggleFavorite(pinned, query('aave'))).toEqual([result('https://uniswap.org/')])
  })

  it('ignores null favorites and blank payloads', () => {
    const current = [query('aave')]

    expect(toggleFavorite(current, null)).toEqual(current)
    expect(toggleFavorite(current, favoriteFromQuery('   '))).toEqual(current)
    expect(toggleFavorite(current, favoriteFromResult({ name: 'X' }))).toEqual(current)
  })

  it('caps the list at the requested limit and drops the oldest', () => {
    const current = [query('a'), query('b'), query('c')]

    expect(toggleFavorite(current, query('d'), 3)).toEqual([query('d'), query('a'), query('b')])
  })
})

describe('parseFavorites', () => {
  it('returns an empty list for non-arrays', () => {
    expect(parseFavorites(null)).toEqual([])
    expect(parseFavorites({ kind: 'query', query: 'aave' })).toEqual([])
  })

  it('drops unknown, malformed, and blank items', () => {
    expect(
      parseFavorites([
        { kind: 'result', name: 'Uniswap', url: 'https://uniswap.org/' },
        { kind: 'result', name: 'Broken' },
        { kind: 'query', query: '   ' },
        { kind: 'other', query: 'nope' },
        'aave',
        { kind: 'query', query: '  Aave  ' },
      ]),
    ).toEqual([
      {
        kind: 'result',
        id: 'https://uniswap.org/',
        name: 'Uniswap',
        url: 'https://uniswap.org/',
      },
      query('Aave'),
    ])
  })

  it('deduplicates by URL and normalized query, keeping the first', () => {
    expect(
      parseFavorites([
        { kind: 'result', name: 'Uni', url: 'https://uniswap.org/' },
        { kind: 'result', name: 'Uniswap', url: 'https://uniswap.org/' },
        { kind: 'query', query: 'Aave' },
        { kind: 'query', query: 'aave' },
      ]),
    ).toEqual([
      {
        kind: 'result',
        id: 'https://uniswap.org/',
        name: 'Uni',
        url: 'https://uniswap.org/',
      },
      query('Aave'),
    ])
  })

  it('caps the parsed list', () => {
    expect(
      parseFavorites(
        [
          { kind: 'query', query: 'a' },
          { kind: 'query', query: 'b' },
          { kind: 'query', query: 'c' },
        ],
        2,
      ),
    ).toEqual([query('a'), query('b')])
  })
})

describe('loadFavorites / saveFavorites', () => {
  const memory = new Map<string, string>()

  beforeEach(() => {
    memory.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns an empty list when localStorage is missing', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(loadFavorites()).toEqual([])
  })

  it('returns an empty list when storage is empty or invalid', () => {
    expect(loadFavorites()).toEqual([])

    memory.set(FAVORITE_STORAGE_KEY, '{')

    expect(loadFavorites()).toEqual([])
  })

  it('round-trips valid favorites', () => {
    const favorites = [result('https://uniswap.org/'), query('Aave')]

    saveFavorites(favorites)

    expect(memory.get(FAVORITE_STORAGE_KEY)).toBe(JSON.stringify(favorites))
    expect(loadFavorites()).toEqual(favorites)
  })
})
