import { PinButton } from '@/components/search/PinButton'
import { RowEnterHint } from '@/components/search/RowEnterHint'
import { SearchResultItem } from '@/components/search/SearchResultItem'
import { ArrowUpRightIcon } from '@/components/shared/Icons'
import { CommandGroup, CommandItem } from '@/components/ui/command'
import type { Favorite } from '@/lib/favorites'
import type { SearchResult } from '@/lib/search/types'
import { generateReactKey } from '@/lib/utils'

interface FavoritesProps {
  favorites: Favorite[]
  onOpenResult: (result: SearchResult) => void
  onSelectQuery: (query: string) => void
  onToggleQuery: (query: string) => void
  onToggleResult: (result: SearchResult) => void
}

const resultFromFavorite = (favorite: Extract<Favorite, { kind: 'result' }>): SearchResult => {
  return {
    id: favorite.id,
    name: favorite.name,
    url: favorite.url,
    displayUrl: favorite.displayUrl,
    logo: favorite.logo,
  }
}

export const Favorites = ({
  favorites,
  onOpenResult,
  onSelectQuery,
  onToggleQuery,
  onToggleResult,
}: FavoritesProps) => {
  if (favorites.length === 0) {
    return null
  }

  return (
    <CommandGroup heading="Favorites">
      {favorites.map((favorite) => {
        if (favorite.kind === 'result') {
          const result = resultFromFavorite(favorite)

          return (
            <SearchResultItem
              key={generateReactKey('result', favorite.id)}
              query=""
              result={result}
              value={`favorite:result:${favorite.id}`}
              pinned
              onOpen={onOpenResult}
              onTogglePin={onToggleResult}
            />
          )
        }

        return (
          <CommandItem
            key={generateReactKey('query', favorite.id)}
            className="group"
            value={`favorite:query:${favorite.id}`}
            onSelect={() => onSelectQuery(favorite.query)}
          >
            <div className="flex justify-center items-center size-8 shrink-0">
              <ArrowUpRightIcon className="size-4 text-muted-foreground" />
            </div>
            <span className="min-w-0 flex-1 truncate text-[13px]">{favorite.query}</span>
            <RowEnterHint />
            <PinButton
              label={favorite.query}
              pinned
              onToggle={() => onToggleQuery(favorite.query)}
            />
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}
