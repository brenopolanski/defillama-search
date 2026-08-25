import type { DirectoryHit, SearchResult } from './types'

export const extractResultUrl = (hit: DirectoryHit): string | undefined => {
  const route = hit.route?.trim()

  if (!route) {
    return undefined
  }

  try {
    const parsed = new URL(route)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined
    }

    return parsed.toString()
  } catch {
    return undefined
  }
}

const countHostnames = (hits: readonly DirectoryHit[]): Map<string, number> => {
  const counts = new Map<string, number>()

  for (const hit of hits) {
    const url = extractResultUrl(hit)

    if (!url) {
      continue
    }

    try {
      const hostname = new URL(url).hostname
      counts.set(hostname, (counts.get(hostname) ?? 0) + 1)
    } catch {
      // Ignore malformed routes; the official site does the same.
    }
  }

  return counts
}

export const displayUrlForHit = (
  hit: DirectoryHit,
  hits: readonly DirectoryHit[],
): string | undefined => {
  const href = extractResultUrl(hit)

  if (!href) {
    return undefined
  }

  const hostnameCounts = countHostnames(hits)

  try {
    const parsed = new URL(href)

    if ((hostnameCounts.get(parsed.hostname) ?? 0) === 1) {
      return parsed.hostname
    }
  } catch {
    // Fall through to the path form used by the official site.
  }

  return href.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export const resultSubtitle = (hit: DirectoryHit): string | undefined => {
  const previous = hit.previousNames?.[0]?.trim()

  if (previous) {
    return `formerly ${previous}`
  }

  const subName = hit.subName?.trim()

  if (!subName) {
    return undefined
  }

  return subName
}

export const transformHits = (hits: readonly DirectoryHit[]): SearchResult[] => {
  return hits.map((hit, index) => {
    const name = hit.name?.trim()
    const resolvedName = name ?? 'Unknown'
    const logo = hit.logo?.trim()
    const url = extractResultUrl(hit)

    return {
      id: url ? `${url}:${index}` : `${resolvedName}:${index}`,
      name: resolvedName,
      subtitle: resultSubtitle(hit),
      url,
      displayUrl: displayUrlForHit(hit, hits),
      logo,
    }
  })
}
