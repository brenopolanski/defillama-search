import { useState } from 'react'

import { SearchCommand } from '@/components/search/SearchCommand'

const App = () => {
  const [query, setQuery] = useState('')

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-background">
      <SearchCommand query={query} onQueryChange={setQuery} />
    </div>
  )
}

export default App
