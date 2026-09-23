import { useFilter } from '../hooks/FilterContext.jsx'
import { PROFICIENCIES, PROFICIENCY_LABELS } from '../utils/filter.js'

// 숙련도 체크박스 3개(칩 모양). 메인 화면과 문장 표 화면이 같은 필터 상태를 쓴다.
export default function ProficiencyFilter() {
  const { filter, toggle } = useFilter()
  const partial = filter.length < PROFICIENCIES.length
  return (
    <fieldset className="filter">
      <legend>
        숙련도
        {partial && (
          <em className="filter-count">
            {filter.length}/{PROFICIENCIES.length}
          </em>
        )}
      </legend>
      {PROFICIENCIES.map((p) => (
        <label key={p} className={`chip p${p}`}>
          <input type="checkbox" checked={filter.includes(p)} onChange={() => toggle(p)} />
          <span>{PROFICIENCY_LABELS[p]}</span>
        </label>
      ))}
    </fieldset>
  )
}
