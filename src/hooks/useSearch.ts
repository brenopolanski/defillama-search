import { useEffect, useRef, useState } from 'react'

import { SEARCH_DEBOUNCE_MS, SEARCH_FAILED } from '@/lib/constants'
import { search } from '@/lib/search/client'
import type { SearchResult } from '@/lib/search/types'

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export const useSearch = (query: string) => {
  const [results, setResults] = useState<SearchResult[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const trimmed = query.trim()
    const currentId = ++requestId.current

    if (!trimmed) {
      setResults([])
      setStatus('idle')
      setError(null)
      return
    }

    const timeout = window.setTimeout(async () => {
      setStatus('loading')
      setError(null)

      try {
        const next = await search(trimmed)

        if (currentId !== requestId.current) {
          return
        }

        setResults(next)
        setStatus(next.length > 0 ? 'success' : 'empty')
      } catch {
        if (currentId !== requestId.current) {
          return
        }

        setResults([])
        setStatus('error')
        setError(SEARCH_FAILED)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [query])

  return { results, status, error }
}
