import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'

import { ABOUT_WINDOW_LABEL } from '@/lib/constants'

/** Both windows load the same bundle, so the query string picks the view. */
export const isAboutWindow = (): boolean => {
  return new URLSearchParams(window.location.search).get('window') === ABOUT_WINDOW_LABEL
}

export const closeCurrentWindow = (): Promise<void> => {
  return getCurrentWindow().close()
}

export const getAppVersion = (): Promise<string> => {
  return getVersion()
}

export const hideSearchWindow = (): Promise<void> => {
  return invoke('hide_search_window')
}

export const openResultUrl = (url: string): Promise<void> => {
  return invoke('open_result_url', { url })
}

export const onSearchWindowShown = (handler: () => void): Promise<() => void> => {
  return listen('search-window-shown', handler).then((unlisten) => () => unlisten())
}

export const onSearchRecentsCleared = (handler: () => void): Promise<() => void> => {
  return listen('search-recents-cleared', handler).then((unlisten) => () => unlisten())
}

export const onSearchFavoritesCleared = (handler: () => void): Promise<() => void> => {
  return listen('search-favorites-cleared', handler).then((unlisten) => () => unlisten())
}
