import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { isSttSupported, startRecognition } from '../services/stt.js'

// 중앙 행의 "내가 말한 내용" 셀: 마이크 + 입력창. 문장이 바뀌면 부모가 key로 새로 만든다.
// 저장은 인식이 끝났을 때, 또는 타이핑 후 입력창을 벗어날 때. 인식 실패 시 기존 발화는 그대로 둔다.
export default function TranscriptCell({ sentence, onSave, onNotice }) {
  const [text, setText] = useState(sentence.last_transcript)
  const [listening, setListening] = useState(false)
  const session = useRef(null)
  const textareaRef = useRef(null)
  const supported = isSttSupported()

  // 문장을 떠나면 진행 중인 인식은 결과를 버리고 멈춘다.
  useEffect(() => () => session.current?.abort(), [])

  // textarea 안 스크롤 대신 내용에 맞춰 칸 자체가 늘어나도록(카드 전체 스크롤로 확인).
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  async function save(value) {
    if (value === sentence.last_transcript) return
    try {
      await onSave(sentence.id, value)
    } catch (err) {
      onNotice(err.message)
    }
  }

  function toggleMic() {
    if (listening) {
      session.current?.stop()
      return
    }
    onNotice('')
    setListening(true)
    session.current = startRecognition({
      onInterim: setText,
      onEnd: ({ transcript, error }) => {
        session.current = null
        setListening(false)
        if (error) {
          setText(sentence.last_transcript) // 실시간 표시를 되돌린다
          onNotice(error)
          return
        }
        setText(transcript)
        save(transcript)
      },
    })
  }

  return (
    <div className="transcript-cell" onClick={(e) => e.stopPropagation()}>
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} // 한 줄짜리 입력처럼 줄바꿈은 막는다
        onBlur={() => !listening && save(text)}
        placeholder={supported ? '마이크를 누르거나 직접 타이핑하세요…' : '직접 입력'}
        aria-label="내가 말한 내용"
      />
      <button
        type="button"
        className={listening ? 'mic-pill recording' : 'mic-pill'}
        onClick={toggleMic}
        disabled={!supported}
        aria-label={listening ? '녹음 중지' : '말하기 시작'}
        title={supported ? undefined : '이 브라우저는 음성 인식을 지원하지 않습니다'}
      >
        <Mic size={18} className={listening ? 'mic-pill-icon bouncing' : 'mic-pill-icon'} aria-hidden="true" />
        <span>{listening ? '듣고 있습니다…' : '말하기 시작'}</span>
      </button>
    </div>
  )
}
