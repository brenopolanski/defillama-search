import { useState } from 'react'

import { PinButton } from '@/components/search/PinButton'
import { CommandItem } from '@/components/ui/command'
import type { SearchResult } from '@/lib/search/types'

interface SearchResultItemProps {
  result: SearchResult
  query: string
  pinned: boolean
  value?: string
  onOpen: (result: SearchResult) => void
  onTogglePin: (result: SearchResult) => void
}

export const SearchResultItem = ({
  result,
  query,
  pinned,
  value,
  onOpen,
  onTogglePin,
}: SearchResultItemProps) => {
  return (
    <CommandItem
      className="min-h-[52px]"
      value={value ?? `result:${result.id}`}
      onSelect={() => onOpen(result)}
    >
      <ResultIcon logo={result.logo} name={result.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] leading-5 text-foreground">
          <HighlightedText query={query} text={result.name} />
          {result.subtitle && <span className="text-muted-foreground"> ({result.subtitle})</span>}
        </div>
        {result.displayUrl && (
          <div className="truncate text-[12px] leading-4 text-muted-foreground">
            {result.displayUrl}
          </div>
        )}
      </div>
      {result.url && (
        <PinButton label={result.name} pinned={pinned} onToggle={() => onTogglePin(result)} />
      )}
    </CommandItem>
  )
}

interface ResultIconProps {
  name: string
  logo?: string
}

const ResultIcon = ({ name, logo }: ResultIconProps) => {
  const [failed, setFailed] = useState(false)
  const initial = (name[0] || '?').toUpperCase()

  return (
    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3c4043] text-[12px] font-semibold text-brand">
      {logo && !failed ? (
        <img alt="" className="size-8 object-cover" src={logo} onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </div>
  )
}

interface HighlightedTextProps {
  text: string
  query: string
}

const HighlightedText = ({ text, query }: HighlightedTextProps) => {
  const needle = query.trim()
  if (!needle) {
    return <>{text}</>
  }

  const index = text.toLowerCase().indexOf(needle.toLowerCase())
  if (index === -1) {
    return <>{text}</>
  }

  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-brand">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  )
}
