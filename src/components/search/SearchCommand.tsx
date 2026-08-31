import { useCallback, useRef } from 'react'

import { Favorites } from '@/components/search/Favorites'
import { PinSearchAction } from '@/components/search/PinSearchAction'
import { RecentSearches } from '@/components/search/RecentSearches'
import { SearchEmpty } from '@/components/search/SearchEmpty'
import { SearchError } from '@/components/search/SearchError'
import { SearchLoading } from '@/components/search/SearchLoading'
import { SearchResultItem } from '@/components/search/SearchResultItem'
import { DefiLlamaIcon, SearchIcon, XIcon } from '@/components/shared/Icons'
import { Loading } from '@/components/shared/Loading'
import { Command, CommandGroup, CommandInput, CommandList } from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import { useFavorites } from '@/hooks/useFavorites'
import { useRecentSearches } from '@/hooks/useRecentSearches'
import { useSearch } from '@/hooks/useSearch'
import { useWindowEvents } from '@/hooks/useWindowEvents'
import { DEFILLAMA_SEARCH } from '@/lib/constants'
import { hideSearchWindow, openResultUrl } from '@/lib/desktop'
import type { SearchResult } from '@/lib/search/types'
import { CLEAR_LABEL, NAVIGATE_LABEL, OPEN_LABEL } from '@/lib/shortcuts'
import { generateReactKey } from '@/lib/utils'

interface SearchCommandProps {
  query: string
  onQueryChange: (query: string) => void
}

export const SearchCommand = ({ query, onQueryChange }: SearchCommandProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { results, status } = useSearch(query)
  const { recents, addRecent, clearRecents } = useRecentSearches()
  const { favorites, isQueryPinned, isResultPinned, toggleQuery, toggleResult, clearFavorites } =
    useFavorites()

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  const clearSearch = useCallback(() => {
    onQueryChange('')
    focusInput()
  }, [focusInput, onQueryChange])

  useWindowEvents({
    onShown: focusInput,
    onEscape: clearSearch,
    onRecentsCleared: clearRecents,
    onFavoritesCleared: clearFavorites,
  })

  const openResult = useCallback(
    async (result: SearchResult) => {
      if (!result.url) {
        return
      }

      addRecent(query)

      try {
        await openResultUrl(result.url)
      } catch {
        await hideSearchWindow()
      }
    },
    [addRecent, query],
  )

  const showRecents = status === 'idle'
  const showLoading = status === 'loading' && results.length === 0
  const showResults = status === 'success' || (status === 'loading' && results.length > 0)

  return (
    <Command className="h-full" label={DEFILLAMA_SEARCH} shouldFilter={false} loop>
      <div className="flex h-14 shrink-0 items-center gap-3 px-4">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        <CommandInput
          ref={inputRef}
          aria-label="Search crypto websites and apps..."
          autoComplete="off"
          placeholder="Search crypto websites and apps..."
          spellCheck={false}
          value={query}
          autoFocus
          onValueChange={onQueryChange}
        />
        {status === 'loading' && <Loading />}
        {query && (
          <button
            aria-label="Clear search"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            type="button"
            onClick={clearSearch}
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      <Separator />

      <CommandList className="fade-in px-1.5 py-1.5">
        {showRecents && (
          <>
            <Favorites
              favorites={favorites}
              onOpenResult={openResult}
              onSelectQuery={onQueryChange}
              onToggleQuery={toggleQuery}
              onToggleResult={toggleResult}
            />
            <RecentSearches
              isPinned={isQueryPinned}
              recents={recents}
              onSelect={onQueryChange}
              onTogglePin={toggleQuery}
            />
          </>
        )}
        {showLoading && <SearchLoading />}
        {status === 'error' && <SearchError />}
        {(showResults || status === 'empty') && (
          <CommandGroup
            className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:w-full [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:justify-between"
            heading={
              <>
                <span>Results</span>
                <PinSearchAction
                  pinned={isQueryPinned(query)}
                  onToggle={() => toggleQuery(query)}
                />
              </>
            }
          >
            {showResults &&
              results.map((result) => (
                <SearchResultItem
                  key={generateReactKey('result', result.id)}
                  pinned={Boolean(result.url && isResultPinned(result.url))}
                  query={query}
                  result={result}
                  onOpen={openResult}
                  onTogglePin={toggleResult}
                />
              ))}
            {status === 'empty' && <SearchEmpty query={query} />}
          </CommandGroup>
        )}
        {showRecents && favorites.length === 0 && recents.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <p className="text-sm text-foreground">{DEFILLAMA_SEARCH}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              The fastest way to find safe, official links for thousands of crypto projects.
            </p>
          </div>
        )}
      </CommandList>

      <Separator />

      <footer className="flex h-9 shrink-0 items-center justify-between px-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <DefiLlamaIcon className="size-4 shrink-0" />
          <span>{DEFILLAMA_SEARCH}</span>
        </div>
        <div className="flex items-center gap-1">
          <Kbd>{NAVIGATE_LABEL}</Kbd>
          <span>Navigate</span>
          <Kbd>{OPEN_LABEL}</Kbd>
          <span>Open</span>
          <Kbd>{CLEAR_LABEL}</Kbd>
          <span>Clear</span>
        </div>
      </footer>
    </Command>
  )
}
