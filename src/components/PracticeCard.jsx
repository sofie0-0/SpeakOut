import { Eye, EyeOff } from 'lucide-react'
import ListenButton from './ListenButton.jsx'
import ProficiencyBadge from './ProficiencyBadge.jsx'
import TranscriptCell from './TranscriptCell.jsx'

// 보이기/가리기 알약 토글. shown=true(보임)면 손잡이가 오른쪽으로 가며 파랗게 빛난다.
function VisibilityToggle({ shown, onToggle, label }) {
  return (
    <button
      type="button"
      className="visibility-toggle"
      onClick={onToggle}
      aria-pressed={shown}
      aria-label={shown ? `${label} 가리기` : `${label} 보이기`}
    >
      <EyeOff size={12} className="visibility-toggle-icon visibility-toggle-icon--left" aria-hidden="true" />
      <Eye size={12} className="visibility-toggle-icon visibility-toggle-icon--right" aria-hidden="true" />
      <span className="visibility-toggle-knob" aria-hidden="true">
        {shown ? <Eye size={13} /> : <EyeOff size={13} />}
      </span>
    </button>
  )
}

// 카드 한 장의 내용(상태 행 + 영어·한국어·발화 섹션). 캐러셀 배치(transform/opacity)는
// 부모(Carousel)가 맡고, 이 컴포넌트는 표시만 담당한다.
// isActive=false(양옆에 살짝 보이는 카드)는 듣기·마이크·가리기 토글 없이 내용만 조용히 보여준다.
export default function PracticeCard({
  sentence,
  index,
  total,
  isActive,
  showEnglish,
  showKorean,
  onToggleEnglish,
  onToggleKorean,
  onCycleProficiency,
  onSaveTranscript,
  onNotice,
}) {
  return (
    <div className="carousel-card-inner">
      <div className="card-status-row">
        <span className="card-index-label">
          CARD {index + 1} OF {total}
        </span>
        <ProficiencyBadge
          level={sentence.proficiency}
          variant="pill"
          onClick={isActive ? () => onCycleProficiency(sentence) : undefined}
        />
      </div>

      <div className="card-scroll-body">
        <section className="content-section content-section--korean">
          <div className="section-header">
            <span className="accent-dot accent-dot--secondary" aria-hidden="true" />
            <span className="section-label">KOREAN</span>
            {isActive && <VisibilityToggle shown={showKorean} onToggle={onToggleKorean} label="한국어" />}
          </div>
          <div className={`section-text section-text--muted${showKorean ? '' : ' section-text--hidden'}`}>
            {sentence.ko.trim() ? sentence.ko : '(없음)'}
          </div>
        </section>

        <section className="content-section content-section--myspeech">
          <div className="section-header">
            <span className="accent-dot accent-dot--rec" aria-hidden="true" />
            <span className="section-label">MY SPEECH</span>
          </div>
          {isActive ? (
            <TranscriptCell key={sentence.id} sentence={sentence} onSave={onSaveTranscript} onNotice={onNotice} />
          ) : (
            <p className="section-text section-text--muted">{sentence.last_transcript || '(없음)'}</p>
          )}
        </section>

        <section className="content-section content-section--english">
          <div className="section-header">
            <span className="accent-dot accent-dot--primary" aria-hidden="true" />
            <span className="section-label">ENGLISH</span>
            {isActive && <ListenButton text={sentence.en} onNotice={onNotice} />}
            {isActive && <VisibilityToggle shown={showEnglish} onToggle={onToggleEnglish} label="영어" />}
          </div>
          <div className={`section-text section-text--muted${showEnglish ? '' : ' section-text--hidden'}`}>
            {sentence.en.trim() ? sentence.en : '(없음)'}
          </div>
        </section>
      </div>
    </div>
  )
}
