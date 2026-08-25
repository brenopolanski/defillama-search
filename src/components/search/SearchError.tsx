import { DEFILLAMA } from '@/lib/constants'

export const SearchError = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
      <p className="text-sm text-foreground">Unable to search {DEFILLAMA}</p>
      <p className="text-[13px] text-muted-foreground">Please try again.</p>
    </div>
  )
}
