import { Loading } from '@/components/shared/Loading'

export const SearchLoading = () => {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-10 text-[13px] text-muted-foreground">
      <Loading />
      Searching…
    </div>
  )
}
