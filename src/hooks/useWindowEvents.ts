import { useEffect } from 'react'

import {
  onSearchFavoritesCleared,
  onSearchRecentsCleared,
  onSearchWindowShown,
} from '@/lib/desktop'

type Subscribe = (handler: () => void) => Promise<() => void>

interface WindowEventHandlers {
  onShown: () => void
  onEscape: () => void
  onRecentsCleared: () => void
  onFavoritesCleared: () => void
}

const useDesktopEvent = (subscribe: Subscribe, handler: () => void) => {
  useEffect(() => {
    let disposed = false
    let unlisten: (() => void) | undefined

    void subscribe(() => {
      if (!disposed) {
        handler()
      }
    }).then((stop) => {
      if (disposed) {
        stop()
        return
      }

      unlisten = stop
    })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [subscribe, handler])
}

export const useWindowEvents = ({
  onShown,
  onEscape,
  onRecentsCleared,
  onFavoritesCleared,
}: WindowEventHandlers) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onEscape])

  useDesktopEvent(onSearchWindowShown, onShown)
  useDesktopEvent(onSearchRecentsCleared, onRecentsCleared)
  useDesktopEvent(onSearchFavoritesCleared, onFavoritesCleared)
}
