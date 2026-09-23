import { PROFICIENCY_LABELS } from '../utils/filter.js'

// 숙련도 표시. variant='gauge'(기본, 문장 표 화면 등)는 3칸 눈금 게이지 + 라벨,
// variant='pill'(캐러셀 카드 헤더)은 색이 있는 단순 알약 배지.
// onClick이 있으면 눌러서 바꾸는 버튼(활성 카드), 없으면 읽기 전용 표시.
export default function ProficiencyBadge({ level, onClick, variant = 'gauge' }) {
  const label = PROFICIENCY_LABELS[level]

  if (variant === 'pill') {
    const content = <span>{label}</span>
    if (onClick) {
      return (
        <button type="button" className={`badge-pill p${level}`} onClick={onClick} title="클릭하면 숙련도가 바뀝니다">
          {content}
        </button>
      )
    }
    return <span className={`badge-pill p${level}`}>{content}</span>
  }

  const ticks = (
    <>
      <span className="gauge" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <i key={i} className={i <= level ? 'on' : ''} />
        ))}
      </span>
      <span>{label}</span>
    </>
  )
  if (onClick) {
    return (
      <button type="button" className={`badge p${level}`} onClick={onClick} title="클릭하면 숙련도가 바뀝니다">
        {ticks}
      </button>
    )
  }
  return <span className={`badge p${level}`}>{ticks}</span>
}
