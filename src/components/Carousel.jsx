import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { useCenter } from '../hooks/CenterContext.jsx'
import { useFilter } from '../hooks/FilterContext.jsx'
import { useFolders } from '../hooks/FoldersContext.jsx'
import { useSentences } from '../hooks/useSentences.js'
import { filterSentences, sortByPosition } from '../utils/filter.js'
import { findNeighbor, resolveCurrent } from '../utils/navigation.js'
import { isSttSupported } from '../services/stt.js'
import PracticeCard from './PracticeCard.jsx'
import ProficiencyFilter from './ProficiencyFilter.jsx'

const SWIPE_THRESHOLD = 60 // px. 가로 스와이프로 인정하는 최소 거리
const DOT_LIMIT = 12 // 이보다 문장이 많으면 점 대신 "N / M" 표시로 바꾼다(수천 문장 대비)

// 오프셋(-1 이전, 0 활성, 1 다음)별 위치·크기·투명도.
function slotStyle(offset) {
  if (offset === -1) return { transform: 'translateX(-105%) scale(0.88)', opacity: 0.7, zIndex: 5 }
  if (offset === 1) return { transform: 'translateX(105%) scale(0.88)', opacity: 0.7, zIndex: 5 }
  return { transform: 'translateX(0%) scale(1)', opacity: 1, zIndex: 10 }
}

function toggleId(setter, id) {
  setter((prev) => {
    const next = new Set(prev)
    if (!next.delete(id)) next.add(id)
    return next
  })
}

// 메인 화면의 카드 캐러셀. 폴더가 바뀌면 통째로 다시 만들어지도록 부모가 key로 folderId를 준다.
export default function Carousel({ folderId }) {
  const { sentences, loaded } = useSentences(folderId)
  const { filter } = useFilter()
  const { setProficiency, setTranscript } = useFolders()
  const { centers, setCenter, ensureLoaded, isCenterLoaded } = useCenter()
  const centerReady = isCenterLoaded(folderId)
  const [shownEn, setShownEn] = useState(() => new Set()) // 영어를 보이게 한 문장 id. 기본은 전부 가림. 저장하지 않는다
  const [hiddenKo, setHiddenKo] = useState(() => new Set()) // 한국어를 가리게 한 문장 id. 기본은 전부 보임. 저장하지 않는다
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('') // 듣기·말하기 안내 문구
  const touchState = useRef(null)

  const ordered = useMemo(() => sortByPosition(sentences), [sentences])
  const passing = useMemo(() => filterSentences(ordered, filter), [ordered, filter])

  // 폴더에 들어올 때 저장해 둔 중앙 문장 id를 읽어 온다.
  useEffect(() => {
    ensureLoaded(folderId)
  }, [folderId, ensureLoaded])

  // 현재(활성) 문장. 기억된 id가 없거나 사라졌으면(삭제 등) 필터를 통과하는 가까운 문장.
  const current = ordered.find((s) => s.id === centers[folderId]) ?? resolveCurrent(ordered, null, filter)

  // 화면에 나열하는 문장: 필터 통과 문장 + (빠졌더라도 이동 전까지 남겨 두는) 현재 문장
  const list = useMemo(
    () => (current && !passing.includes(current) ? sortByPosition([...passing, current]) : passing),
    [passing, current],
  )
  const centerIndex = current ? list.findIndex((s) => s.id === current.id) : -1

  // 필터를 바꾸면(또는 처음 읽으면) 현재 문장이 통과하지 못할 때 가장 가까운 통과 문장으로 옮긴다.
  const latest = useRef({})
  latest.current = { ordered, current }
  useEffect(() => {
    if (!loaded || !centerReady) return
    const { ordered: all, current: cur } = latest.current
    const next = resolveCurrent(all, cur?.id ?? null, filter)
    if (next && next.id !== cur?.id) setCenter(folderId, next.id)
  }, [filter, loaded, centerReady, folderId, setCenter])

  // 기억된 중앙 id가 fallback 결과와 다르면 맞춰 둔다(표 화면을 다녀와도 유지되도록).
  useEffect(() => {
    if (!centerReady) return
    if (current && centers[folderId] !== current.id) setCenter(folderId, current.id)
  }, [current, centers, folderId, setCenter, centerReady])

  // 활성 카드가 다른 문장으로 넘어가면 떠나는 문장은 기본값(영어 가림·한국어 보임)으로 되돌린다.
  const prevCenterId = useRef(null)
  const currentId = current?.id ?? null
  useEffect(() => {
    const prevId = prevCenterId.current
    prevCenterId.current = currentId
    if (prevId && prevId !== currentId) {
      setShownEn((prev) => {
        if (!prev.has(prevId)) return prev
        const next = new Set(prev)
        next.delete(prevId)
        return next
      })
      setHiddenKo((prev) => {
        if (!prev.has(prevId)) return prev
        const next = new Set(prev)
        next.delete(prevId)
        return next
      })
    }
  }, [currentId])

  function move(direction) {
    if (!current) return
    const next = findNeighbor(ordered, current.id, direction, filter)
    if (next) {
      setNotice('')
      setCenter(folderId, next.id)
    }
  }

  function jumpTo(id) {
    setNotice('')
    setCenter(folderId, id)
  }

  async function cycleProficiency(sentence) {
    try {
      await setProficiency(sentence.id, (sentence.proficiency + 1) % 3)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  function handleTouchStart(e) {
    const t = e.touches[0]
    touchState.current = { x0: t.clientX, y0: t.clientY }
  }
  function handleTouchEnd(e) {
    const start = touchState.current
    touchState.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x0
    const dy = t.clientY - start.y0
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      move(dx < 0 ? 'down' : 'up')
    }
  }

  if (!loaded || !centerReady) return null
  if (ordered.length === 0) {
    return (
      <div className="state-card">
        <Inbox size={28} aria-hidden="true" />
        <p>문장이 없습니다. + 버튼으로 추가하세요.</p>
      </div>
    )
  }

  // 이전/다음 이웃. findNeighbor가 필터 통과 + 순환을 이미 처리한다.
  const rawPrev = current ? findNeighbor(ordered, current.id, 'up', filter) : null
  const rawNext = current ? findNeighbor(ordered, current.id, 'down', filter) : null
  const prevSentence = rawPrev && current && rawPrev.id !== current.id ? rawPrev : null
  const sameAsPrev = rawNext && prevSentence && rawNext.id === prevSentence.id
  const nextSentence = rawNext && current && rawNext.id !== current.id && !sameAsPrev ? rawNext : null

  return (
    <div className="practice-shell">
      {(error || notice || !isSttSupported()) && (
        <div className="carousel-notices">
          {error && <p className="notice error">{error}</p>}
          {notice && <p className="notice error">{notice}</p>}
          {!isSttSupported() && (
            <p className="notice">
              이 브라우저는 음성 인식을 지원하지 않아 마이크를 쓸 수 없습니다. Chrome에서 열어 주세요. 직접 입력은 가능합니다.
            </p>
          )}
        </div>
      )}

      <div className="carousel-filter-row">
        <ProficiencyFilter />
      </div>

      {list.length === 0 ? (
        <div className="state-card">
          <Inbox size={28} aria-hidden="true" />
          <p>조건에 맞는 문장이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="carousel-viewport" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {prevSentence && (
              <div
                key={prevSentence.id}
                className="carousel-slot carousel-slot--peek"
                style={slotStyle(-1)}
                onClick={() => jumpTo(prevSentence.id)}
              >
                <div className="carousel-card">
                  <PracticeCard
                    sentence={prevSentence}
                    index={list.findIndex((s) => s.id === prevSentence.id)}
                    total={list.length}
                    isActive={false}
                    showEnglish={shownEn.has(prevSentence.id)}
                    showKorean={!hiddenKo.has(prevSentence.id)}
                  />
                </div>
              </div>
            )}

            <div key={current.id} className="carousel-slot carousel-slot--active" style={slotStyle(0)}>
              <div className="carousel-card">
                <PracticeCard
                  sentence={current}
                  index={centerIndex}
                  total={list.length}
                  isActive
                  showEnglish={shownEn.has(current.id)}
                  showKorean={!hiddenKo.has(current.id)}
                  onToggleEnglish={() => toggleId(setShownEn, current.id)}
                  onToggleKorean={() => toggleId(setHiddenKo, current.id)}
                  onCycleProficiency={cycleProficiency}
                  onSaveTranscript={setTranscript}
                  onNotice={setNotice}
                />
              </div>
            </div>

            {nextSentence && (
              <div
                key={nextSentence.id}
                className="carousel-slot carousel-slot--peek"
                style={slotStyle(1)}
                onClick={() => jumpTo(nextSentence.id)}
              >
                <div className="carousel-card">
                  <PracticeCard
                    sentence={nextSentence}
                    index={list.findIndex((s) => s.id === nextSentence.id)}
                    total={list.length}
                    isActive={false}
                    showEnglish={shownEn.has(nextSentence.id)}
                    showKorean={!hiddenKo.has(nextSentence.id)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="carousel-controls">
            <button type="button" className="icon carousel-nav-btn" onClick={() => move('up')} aria-label="이전 문장" title="이전 문장">
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            {list.length <= DOT_LIMIT ? (
              <div className="carousel-dots" aria-label="문장 목록">
                {list.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={s.id === current.id ? 'carousel-dot carousel-dot--active' : 'carousel-dot'}
                    onClick={() => jumpTo(s.id)}
                    aria-current={s.id === current.id ? 'true' : undefined}
                    aria-label={`${s.position}번 문장으로 이동`}
                  />
                ))}
              </div>
            ) : (
              <span className="carousel-count" aria-label={`${list.length}개 중 ${centerIndex + 1}번째`}>
                {centerIndex + 1} / {list.length}
              </span>
            )}
            <button type="button" className="icon carousel-nav-btn" onClick={() => move('down')} aria-label="다음 문장" title="다음 문장">
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
