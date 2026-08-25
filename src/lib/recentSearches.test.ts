import { describe, expect, it } from 'vitest'

import { normalizeRecentQuery, upsertRecentSearch } from './recentSearches'

describe('normalizeRecentQuery', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeRecentQuery('  uni   swap  ')).toBe('uni swap')
  })

  it('returns an empty string for blank input', () => {
    expect(normalizeRecentQuery('   ')).toBe('')
  })
})

describe('upsertRecentSearch', () => {
  it('adds the newest query first', () => {
    expect(upsertRecentSearch(['ethereum'], 'uniswap')).toEqual(['uniswap', 'ethereum'])
  })

  it('deduplicates case-insensitively and keeps the latest spelling', () => {
    expect(upsertRecentSearch(['Uniswap', 'aave'], 'uniswap')).toEqual(['uniswap', 'aave'])
  })

  it('ignores blank queries', () => {
    expect(upsertRecentSearch(['aave'], '   ')).toEqual(['aave'])
  })

  it('caps the list at the requested limit', () => {
    expect(upsertRecentSearch(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b'])
  })
})
