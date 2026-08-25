import { invoke } from '@tauri-apps/api/core'

import { transformHits } from './transform'
import type { DirectoryHit, SearchResult } from './types'
import { SearchError } from './types'

export const search = async (query: string): Promise<SearchResult[]> => {
  const trimmed = query.trim()

  if (!trimmed) {
    return []
  }

  try {
    const hits = await invoke<DirectoryHit[]>('search_directory', {
      query: trimmed,
    })

    if (!Array.isArray(hits)) {
      throw new SearchError()
    }

    return transformHits(hits)
  } catch (error) {
    if (error instanceof SearchError) {
      throw error
    }

    throw new SearchError()
  }
}
