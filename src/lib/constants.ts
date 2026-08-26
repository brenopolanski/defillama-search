/** Brand spelling: one word, capital D and L. The F is not capitalized. */
export const DEFILLAMA = 'DefiLlama'
export const DEFILLAMA_SEARCH = `${DEFILLAMA} Search`

/** Native window size. Keep in sync with src-tauri/tauri.conf.json */
export const SEARCH_WINDOW = {
  width: 600,
  height: 480,
} as const

/** Keep in sync with ABOUT_WINDOW_LABEL in src-tauri/src/window.rs */
export const ABOUT_WINDOW_LABEL = 'about'

export const SEARCH_FAILED = 'Search failed'
export const SEARCH_DEBOUNCE_MS = 100
export const SEARCH_RESULT_LIMIT = 20
export const RECENT_SEARCH_LIMIT = 8
export const RECENT_SEARCH_STORAGE_KEY = 'defillama-search.recent'
export const FAVORITE_LIMIT = 20
export const FAVORITE_STORAGE_KEY = 'defillama-search.favorites'
