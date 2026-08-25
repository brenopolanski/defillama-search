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

import { DEFILLAMA } from '@/lib/constants'

export interface SearchResult {
  id: string
  name: string
  subtitle?: string
  url?: string
  displayUrl?: string
  logo?: string
}

export class SearchError extends Error {
  constructor(message = `Unable to search ${DEFILLAMA}`) {
    super(message)
    this.name = 'SearchError'
  }
}
