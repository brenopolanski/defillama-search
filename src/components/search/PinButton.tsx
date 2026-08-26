import type * as React from 'react'

import { PinIcon } from '@/components/shared/Icons'
import { cn } from '@/lib/utils'

interface PinButtonProps {
  label: string
  pinned: boolean
  onToggle: () => void
}

export const PinButton = ({ label, pinned, onToggle }: PinButtonProps) => {
  const action = pinned ? 'Unpin' : 'Pin'

  const stopRowAction = (event: React.MouseEvent | React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <button
      aria-label={`${action} ${label}`}
      aria-pressed={pinned}
      className={cn(
        'shrink-0 rounded-full p-1 transition-colors hover:bg-white/10',
        pinned ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
      )}
      type="button"
      onClick={(event) => {
        stopRowAction(event)
        onToggle()
      }}
      onMouseDown={stopRowAction}
      onPointerDown={stopRowAction}
    >
      <PinIcon className={cn('size-4', pinned && 'fill-current')} />
    </button>
  )
}
