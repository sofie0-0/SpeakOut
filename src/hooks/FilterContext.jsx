import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DEFAULT_FILTER } from '../utils/filter.js'

// 숙련도 필터(통과시킬 숙련도 배열)를 메인 화면과 문장 표 화면이 함께 쓴다. 저장하지 않는다.
const FilterContext = createContext(null)

export function FilterProvider({ children }) {
  const [filter, setFilter] = useState(DEFAULT_FILTER)

  const toggle = useCallback((proficiency) => {
    setFilter((prev) =>
      prev.includes(proficiency) ? prev.filter((p) => p !== proficiency) : [...prev, proficiency].sort(),
    )
  }, [])

  const value = useMemo(() => ({ filter, toggle }), [filter, toggle])
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilter() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilter는 FilterProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
