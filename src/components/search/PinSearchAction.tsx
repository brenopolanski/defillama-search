import type * as React from 'react'

import { PinIcon } from '@/components/shared/Icons'
import { cn } from '@/lib/utils'

interface PinSearchActionProps {
  pinned: boolean
  onToggle: () => void
}

export const PinSearchAction = ({ pinned, onToggle }: PinSearchActionProps) => {
  const stopGroupAction = (event: React.MouseEvent | React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <button
      aria-label={pinned ? 'Unpin this search' : 'Pin this search'}
      aria-pressed={pinned}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] font-medium tracking-normal normal-case transition-colors hover:bg-white/10',
        pinned ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
      )}
      type="button"
      onClick={(event) => {
        stopGroupAction(event)
        onToggle()
      }}
      onMouseDown={stopGroupAction}
      onPointerDown={stopGroupAction}
    >
      <PinIcon className={cn('size-3.5', pinned && 'fill-current')} />
      <span>{pinned ? 'Search pinned' : 'Pin this search'}</span>
    </button>
  )
}
