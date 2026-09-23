export const CsvErrorCode = {
  EMPTY_FILE: 'EMPTY_FILE',
  NOT_CSV: 'NOT_CSV',
  UNTERMINATED_QUOTE: 'UNTERMINATED_QUOTE',
  MISSING_COLUMN: 'MISSING_COLUMN',
}

export class CsvError extends Error {
  constructor(code, message) {
    super(message ?? code)
    this.name = 'CsvError'
    this.code = code
  }
}

// RFC 4180 방식 파서. 따옴표 안의 쉼표·줄바꿈, "" 이스케이프, BOM, CRLF/LF/CR을 처리한다.
// 문자열의 2차원 배열을 돌려준다.
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  if (text.includes('\u0000')) {
    throw new CsvError(CsvErrorCode.NOT_CSV, 'CSV 파일이 아닙니다.')
  }

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
          inQuotes = false
          i += 1
        }
      } else {
        field += c
        i += 1
      }
      continue
    }
    if (c === '"' && field === '') {
      inQuotes = true
      i += 1
    } else if (c === ',') {
      row.push(field)
      field = ''
      i += 1
    } else if (c === '\r' || c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i += c === '\r' && text[i + 1] === '\n' ? 2 : 1
    } else {
      field += c
      i += 1
    }
  }

  if (inQuotes) {
    throw new CsvError(CsvErrorCode.UNTERMINATED_QUOTE, '따옴표가 닫히지 않았습니다.')
  }
  // 마지막 줄이 개행 없이 끝난 경우
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const isBlank = (s) => s.trim() === ''

// 문장 CSV(id, en, ko, transcript)를 검증하고 추가할 항목으로 바꾼다.
// - 열 이름은 header에서 찾는다(대소문자·앞뒤 공백 무시). en, ko는 필수, id는 무시, transcript는 선택.
// - 완전히 빈 줄은 조용히 무시하고, 내용은 있지만 en/ko가 둘 다 빈 행은 skipped로 센다.
// - 형식 오류는 CsvError를 던진다(업로드 전체 취소).
export function parseSentencesCsv(text) {
  const rows = parseCsv(text).filter((r) => !r.every(isBlank))
  if (rows.length === 0) {
    throw new CsvError(CsvErrorCode.EMPTY_FILE, '빈 파일입니다.')
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (name) => header.indexOf(name)
  const enIdx = col('en')
  const koIdx = col('ko')
  const missing = [enIdx < 0 && 'en', koIdx < 0 && 'ko'].filter(Boolean)
  if (missing.length > 0) {
    throw new CsvError(
      CsvErrorCode.MISSING_COLUMN,
      `필수 열이 없습니다: ${missing.join(', ')} (열: id, en, ko, transcript)`,
    )
  }
  const trIdx = col('transcript')

  const items = []
  let skipped = 0
  for (const r of rows.slice(1)) {
    const en = (r[enIdx] ?? '').trim()
    const ko = (r[koIdx] ?? '').trim()
    if (en === '' && ko === '') {
      skipped += 1
      continue
    }
    items.push({ en, ko, last_transcript: trIdx >= 0 ? (r[trIdx] ?? '').trim() : '' })
  }
  return { items, skipped }
}
