// 듣기: 브라우저 내장 speechSynthesis. 외부 서비스는 쓰지 않는다.

export function isTtsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

// 영어 문장을 읽는다. 재생 중이던 것은 멈춘다. 끝나면 onEnd(), 실패하면 onError(안내 문구).
export function speak(text, { onEnd, onError } = {}) {
  if (!isTtsSupported()) {
    onError?.('이 브라우저는 음성 재생(듣기)을 지원하지 않습니다.')
    return
  }
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.onend = () => onEnd?.()
  utterance.onerror = (e) => {
    // cancel()로 멈춘 경우는 실패가 아니다.
    if (e.error === 'canceled' || e.error === 'interrupted') onEnd?.()
    else onError?.('음성을 재생하지 못했습니다.')
  }
  synth.speak(utterance)
}

export function stopSpeaking() {
  if (isTtsSupported()) window.speechSynthesis.cancel()
}
