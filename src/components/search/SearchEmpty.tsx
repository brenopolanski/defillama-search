interface SearchEmptyProps {
  query: string
}

export const SearchEmpty = ({ query }: SearchEmptyProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
      <p className="text-sm text-foreground">No results found</p>
      <p className="text-[13px] text-muted-foreground">
        Try another search{query.trim() ? ` for “${query.trim()}”` : '.'}
      </p>
    </div>
  )
}
