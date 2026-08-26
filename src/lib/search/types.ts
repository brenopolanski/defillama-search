import { SEARCH_FAILED } from '@/lib/constants'

/**
 * Fields observed in the official search.defillama.com client.
 * Extra keys may exist because the site requests attributesToRetrieve: ["*"].
 */
export interface DirectoryHit {
  name?: string
  previousNames?: string[]
  subName?: string
  logo?: string
  route?: string
}

export interface SearchResult {
  id: string
  name: string
  subtitle?: string
  url?: string
  displayUrl?: string
  logo?: string
}

export class SearchError extends Error {
  constructor(message = SEARCH_FAILED) {
    super(message)
    this.name = 'SearchError'
  }
}
