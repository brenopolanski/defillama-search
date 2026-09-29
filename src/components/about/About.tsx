import { useEffect, useState } from 'react'

import { DefiLlamaIcon } from '@/components/shared/Icons'
import { DEFILLAMA, DEFILLAMA_SEARCH } from '@/lib/constants'
import { closeCurrentWindow, getAppVersion } from '@/lib/desktop'

export const About = () => {
  const [version, setVersion] = useState('')

  useEffect(() => {
    let active = true

    void getAppVersion().then((next) => {
      if (active) {
        setVersion(next)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || (event.key === 'w' && event.metaKey)) {
        event.preventDefault()
        void closeCurrentWindow()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div
      className="fade-in flex h-full flex-col items-center justify-center gap-5 bg-background px-8 text-center"
      data-tauri-drag-region
    >
      {/* Mirrors the generated app icon: the logo inset on its dark plate. */}
      <div className="flex size-24 items-center justify-center rounded-[21px] bg-[#F7F7F7] shadow-lg ring-1 ring-white/10">
        <DefiLlamaIcon className="h-17.5 w-auto" />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold text-foreground">{DEFILLAMA_SEARCH}</p>
        <p className="h-4 text-[13px] text-muted-foreground">{version && `Version ${version}`}</p>
      </div>

      <div className="flex flex-col gap-1 text-[12px] leading-relaxed text-muted-foreground">
        <p>© {new Date().getFullYear()} Breno Polanski. MIT License.</p>
        <p>Independent client, not affiliated with {DEFILLAMA}.</p>
      </div>
    </div>
  )
}
