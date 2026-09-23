// 말하기: 브라우저 내장 음성 인식(Chrome의 webkitSpeechRecognition). 외부 API는 쓰지 않는다.
// 참고: Chrome은 인식을 구글 서버에서 처리하므로 인터넷 연결이 필요하다. 마이크는 localhost/HTTPS에서만 동작한다.

function getRecognitionClass() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isSttSupported() {
  return getRecognitionClass() !== null
}

// 소리가 이 시간 동안 없으면 녹음을 자동으로 멈춘다.
const SILENCE_TIMEOUT_MS = 5000

const ERROR_MESSAGES = {
  'not-allowed': '마이크 권한이 거부되었습니다. 브라우저 주소창의 마이크 설정에서 허용해 주세요.',
  'service-not-allowed': '마이크 권한이 거부되었습니다. 브라우저 주소창의 마이크 설정에서 허용해 주세요.',
  'audio-capture': '마이크를 찾을 수 없습니다. 마이크 연결을 확인해 주세요.',
  'no-speech': '말소리를 인식하지 못했습니다. 다시 시도해 주세요.',
  network:
    '음성 인식 서버에 연결하지 못했습니다. 인터넷 연결 외에 브라우저(Brave 등은 음성 인식 미지원), VPN·방화벽·확장 프로그램이 구글 음성 서버를 막는지도 확인해 주세요. 직접 입력은 가능합니다.',
}

// 인식을 시작한다.
// onInterim(text): 인식 중 실시간 텍스트
// onEnd({ transcript, error }): 끝났을 때 한 번. 결과가 없거나 실패하면 transcript는 '', error에 안내 문구.
// 반환값: { stop(), abort() }. stop은 지금까지 들은 것으로 마무리(onEnd 호출), abort는 결과를 버린다(onEnd 호출 안 함).
export function startRecognition({ onInterim, onEnd }) {
  const Recognition = getRecognitionClass()
  if (!Recognition) {
    onEnd({ transcript: '', error: '이 브라우저는 음성 인식(말하기)을 지원하지 않습니다. 직접 입력할 수 있습니다.' })
    return { stop() {}, abort() {} }
  }

  const recognition = new Recognition()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  // continuous로 두면 브라우저가 짧은 멈춤에 알아서 끊지 않는다. 대신 아래 무음 타이머로 직접 끝낸다.
  recognition.continuous = true

  let finalText = ''
  let interimText = ''
  let errorMessage = ''
  let aborted = false
  let silenceTimer = null

  // 소리(말)가 감지될 때마다 타이머를 다시 시작한다. SILENCE_TIMEOUT_MS 동안 조용하면 마무리한다.
  const resetSilenceTimer = () => {
    clearTimeout(silenceTimer)
    silenceTimer = setTimeout(() => recognition.stop(), SILENCE_TIMEOUT_MS)
  }

  recognition.onspeechstart = resetSilenceTimer
  recognition.onresult = (event) => {
    resetSilenceTimer()
    finalText = ''
    interimText = ''
    for (let i = 0; i < event.results.length; i += 1) {
      const result = event.results[i]
      if (result.isFinal) finalText += result[0].transcript
      else interimText += result[0].transcript
    }
    onInterim?.((finalText + interimText).trim())
  }
  recognition.onerror = (event) => {
    if (event.error === 'aborted') return
    console.warn('[stt] 음성 인식 오류:', event.error, event.message || '')
    errorMessage = ERROR_MESSAGES[event.error] ?? '음성 인식에 실패했습니다. 다시 시도해 주세요.'
  }
  recognition.onend = () => {
    clearTimeout(silenceTimer)
    if (aborted) return
    const transcript = (finalText || interimText).trim()
    if (transcript) onEnd({ transcript, error: '' })
    else onEnd({ transcript: '', error: errorMessage || ERROR_MESSAGES['no-speech'] })
  }

  try {
    recognition.start()
    resetSilenceTimer()
  } catch {
    onEnd({ transcript: '', error: '음성 인식을 시작하지 못했습니다. 다시 시도해 주세요.' })
    return { stop() {}, abort() {} }
  }

  return {
    stop: () => recognition.stop(),
    abort: () => {
      aborted = true
      clearTimeout(silenceTimer)
      recognition.abort()
    },
  }
}
