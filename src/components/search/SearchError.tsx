import { SEARCH_FAILED } from '@/lib/constants'

export const SearchError = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
      <p className="text-sm text-foreground">{SEARCH_FAILED}</p>
      <p className="text-[13px] text-muted-foreground">Please try again.</p>
    </div>
  )
}
