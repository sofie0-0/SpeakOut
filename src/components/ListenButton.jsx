import { useEffect, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speak, stopSpeaking } from '../services/tts.js'

// 중앙 행 영어 셀의 [듣기]. 영어 열이 숨겨져 있어도 쓸 수 있다. en이 비어 있으면 비활성.
export default function ListenButton({ text, onNotice }) {
  const [playing, setPlaying] = useState(false)
  const empty = !text.trim()

  // 다른 문장으로 이동하거나 화면을 떠나면 재생을 멈춘다.
  useEffect(() => stopSpeaking, [])

  function handleClick() {
    onNotice('')
    setPlaying(true)
    speak(text, {
      onEnd: () => setPlaying(false),
      onError: (message) => {
        setPlaying(false)
        onNotice(message)
      },
    })
  }

  return (
    <button
      type="button"
      className={playing ? 'listen playing' : 'listen'}
      onClick={handleClick}
      disabled={empty}
      title={empty ? '영어 문장이 없습니다' : undefined}
    >
      <Volume2 size={16} aria-hidden="true" />
      {playing ? '재생 중…' : '듣기'}
    </button>
  )
}
