import { PinButton } from '@/components/search/PinButton'
import { RowEnterHint } from '@/components/search/RowEnterHint'
import { ArrowUpRightIcon } from '@/components/shared/Icons'
import { CommandGroup, CommandItem } from '@/components/ui/command'
import { generateReactKey } from '@/lib/utils'

interface RecentSearchesProps {
  recents: string[]
  isPinned: (query: string) => boolean
  onSelect: (query: string) => void
  onTogglePin: (query: string) => void
}

export const RecentSearches = ({
  recents,
  isPinned,
  onSelect,
  onTogglePin,
}: RecentSearchesProps) => {
  if (recents.length === 0) {
    return null
  }

  return (
    <CommandGroup heading="Recent">
      {recents.map((item) => (
        <CommandItem
          key={generateReactKey('recent', item)}
          className="group"
          value={`recent:${item}`}
          onSelect={() => onSelect(item)}
        >
          <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-[13px]">{item}</span>
          <RowEnterHint />
          <PinButton label={item} pinned={isPinned(item)} onToggle={() => onTogglePin(item)} />
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
