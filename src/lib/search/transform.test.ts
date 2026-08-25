import { describe, expect, it } from 'vitest'

import { displayUrlForHit, extractResultUrl, resultSubtitle, transformHits } from './transform'
import type { DirectoryHit } from './types'

const uniswap: DirectoryHit = {
  name: 'Uniswap',
  route: 'https://uniswap.org/',
  logo: 'https://icons.llamao.fi/uniswap.jpg',
  previousNames: ['Uniswap Exchange'],
}

const uniswapApp: DirectoryHit = {
  name: 'Uniswap App',
  route: 'https://app.uniswap.org',
  subName: 'Interface',
}

const aaveApp: DirectoryHit = {
  name: 'Aave',
  route: 'https://aave.com/app',
}

const aaveDocs: DirectoryHit = {
  name: 'Aave Docs',
  route: 'https://aave.com/docs',
}

describe('extractResultUrl', () => {
  it('accepts http(s) routes and normalizes them', () => {
    expect(extractResultUrl(uniswap)).toBe('https://uniswap.org/')
  })

  it('rejects missing or non-http routes', () => {
    expect(extractResultUrl({})).toBeUndefined()
    expect(extractResultUrl({ route: 'javascript:alert(1)' })).toBeUndefined()
    expect(extractResultUrl({ route: 'not a url' })).toBeUndefined()
  })
})

describe('displayUrlForHit', () => {
  it('shows the hostname when it is unique among results', () => {
    expect(displayUrlForHit(uniswap, [uniswap, uniswapApp])).toBe('uniswap.org')
  })

  it('shows the path when the hostname is shared', () => {
    expect(displayUrlForHit(aaveApp, [aaveApp, aaveDocs])).toBe('aave.com/app')
    expect(displayUrlForHit(aaveDocs, [aaveApp, aaveDocs])).toBe('aave.com/docs')
  })
})

describe('resultSubtitle', () => {
  it('prefers a former name from the API', () => {
    expect(resultSubtitle(uniswap)).toBe('formerly Uniswap Exchange')
  })

  it('falls back to subName when no previous names exist', () => {
    expect(resultSubtitle(uniswapApp)).toBe('Interface')
  })
})

describe('transformHits', () => {
  it('maps documented API fields without inventing metadata', () => {
    const [result] = transformHits([uniswap])

    expect(result).toMatchObject({
      name: 'Uniswap',
      subtitle: 'formerly Uniswap Exchange',
      url: 'https://uniswap.org/',
      displayUrl: 'uniswap.org',
      logo: 'https://icons.llamao.fi/uniswap.jpg',
    })
    expect(result.id).toContain('https://uniswap.org/')
  })
})
