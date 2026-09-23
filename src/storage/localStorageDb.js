// localStorage 접근은 이 파일에서만 한다. 폴더·문장 전체를 한 키(JSON)에 저장하므로
// 한 번의 setItem으로 여러 문장을 갱신해도 전부 성공하거나 전부 취소된다.
const KEY = 'english-study-app:v1'

const emptyDb = () => ({ folders: [], sentences: [] })

export function readDb() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return emptyDb()
  try {
    const db = JSON.parse(raw)
    return {
      folders: Array.isArray(db.folders) ? db.folders : [],
      sentences: Array.isArray(db.sentences) ? db.sentences : [],
    }
  } catch {
    return emptyDb()
  }
}

// 직렬화가 먼저 끝난 뒤 한 번만 쓴다.
export function writeDb(db) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

// 폴더별 "마지막으로 보던 중앙 문장 id". 화면 상태일 뿐 문장 데이터가 아니라 별도 키에 둔다.
// 폴더를 옮겨 갔다 오거나 새로고침·재접속을 해도 보던 번호부터 이어보게 하기 위해서다.
const CENTER_KEY = 'english-study-app:v1:center'

export function readCenterDb() {
  const raw = localStorage.getItem(CENTER_KEY)
  if (!raw) return {}
  try {
    const db = JSON.parse(raw)
    return db && typeof db === 'object' && !Array.isArray(db) ? db : {}
  } catch {
    return {}
  }
}

export function writeCenterDb(db) {
  localStorage.setItem(CENTER_KEY, JSON.stringify(db))
}
