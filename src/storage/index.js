import { StorageError, StorageErrorCode } from './errors.js'
import { readCenterDb, readDb, writeCenterDb, writeDb } from './localStorageDb.js'

export { StorageError, StorageErrorCode }

// 폴더: { id, name }
// 문장: { id, folder_id, position, en, ko, proficiency, last_transcript }
// 모든 함수는 async이고 순수 객체만 돌려준다(v2 Firestore 교체 대비).

const isBlank = (s) => !s || s.trim() === ''

function requireFolder(db, folderId) {
  if (!db.folders.some((f) => f.id === folderId)) {
    throw new StorageError(StorageErrorCode.FOLDER_NOT_FOUND, '폴더를 찾을 수 없습니다.')
  }
}

function requireSentence(db, sentenceId) {
  const sentence = db.sentences.find((s) => s.id === sentenceId)
  if (!sentence) {
    throw new StorageError(StorageErrorCode.SENTENCE_NOT_FOUND, '문장을 찾을 수 없습니다.')
  }
  return sentence
}

// ---- 폴더 ----

// 만든 순서대로 돌려준다(가장 먼저 만든 폴더가 첫 번째).
export async function listFolders() {
  return readDb().folders
}

export async function createFolder(name) {
  const trimmed = (name ?? '').trim()
  if (trimmed === '') {
    throw new StorageError(StorageErrorCode.EMPTY_FOLDER_NAME, '폴더 이름을 입력해 주세요.')
  }
  const db = readDb()
  if (db.folders.some((f) => f.name === trimmed)) {
    throw new StorageError(StorageErrorCode.DUPLICATE_FOLDER_NAME, '이미 있는 폴더 이름입니다.')
  }
  const folder = { id: crypto.randomUUID(), name: trimmed }
  db.folders.push(folder)
  writeDb(db)
  return folder
}

// 폴더와 그 안의 문장을 함께 삭제한다.
export async function deleteFolder(folderId) {
  const db = readDb()
  requireFolder(db, folderId)
  db.folders = db.folders.filter((f) => f.id !== folderId)
  db.sentences = db.sentences.filter((s) => s.folder_id !== folderId)
  writeDb(db)
}

// ---- 문장 ----

export async function listSentences(folderId) {
  return readDb()
    .sentences.filter((s) => s.folder_id === folderId)
    .sort((a, b) => a.position - b.position)
}

export async function countSentences(folderId) {
  return readDb().sentences.filter((s) => s.folder_id === folderId).length
}

// items: [{ en, ko, last_transcript? }]. 폴더 맨 뒤부터 순서대로 position을 부여한다.
// en/ko가 둘 다 빈 항목은 건너뛰고 개수를 돌려준다(CSV용). 중복 영어 문장은 허용.
export async function addSentences(folderId, items) {
  const db = readDb()
  requireFolder(db, folderId)
  let position = db.sentences.filter((s) => s.folder_id === folderId).length
  const added = []
  let skipped = 0
  for (const item of items) {
    const en = (item.en ?? '').trim()
    const ko = (item.ko ?? '').trim()
    if (en === '' && ko === '') {
      skipped += 1
      continue
    }
    added.push({
      id: crypto.randomUUID(),
      folder_id: folderId,
      position: ++position,
      en,
      ko,
      proficiency: 0,
      last_transcript: item.last_transcript ?? '',
    })
  }
  db.sentences.push(...added)
  writeDb(db)
  return { added, skipped }
}

// 직접 입력용. 둘 다 비면 거부한다.
export async function addSentence(folderId, { en, ko }) {
  if (isBlank(en) && isBlank(ko)) {
    throw new StorageError(StorageErrorCode.EMPTY_SENTENCE, '영어나 한국어 중 하나는 입력해 주세요.')
  }
  const { added } = await addSentences(folderId, [{ en, ko }])
  return added[0]
}

// en/ko만 수정한다. 숙련도와 발화는 유지.
export async function updateSentence(sentenceId, { en, ko }) {
  if (isBlank(en) && isBlank(ko)) {
    throw new StorageError(StorageErrorCode.EMPTY_SENTENCE, '영어나 한국어 중 하나는 입력해 주세요.')
  }
  const db = readDb()
  const sentence = requireSentence(db, sentenceId)
  sentence.en = (en ?? '').trim()
  sentence.ko = (ko ?? '').trim()
  writeDb(db)
  return sentence
}

// 삭제 후 같은 폴더의 뒤 문장 position을 하나씩 당긴다(한 번의 쓰기).
export async function deleteSentence(sentenceId) {
  const db = readDb()
  const target = requireSentence(db, sentenceId)
  db.sentences = db.sentences.filter((s) => s.id !== sentenceId)
  for (const s of db.sentences) {
    if (s.folder_id === target.folder_id && s.position > target.position) s.position -= 1
  }
  writeDb(db)
}

export async function setProficiency(sentenceId, proficiency) {
  if (![0, 1, 2].includes(proficiency)) {
    throw new StorageError(StorageErrorCode.INVALID_PROFICIENCY, '숙련도는 0, 1, 2 중 하나여야 합니다.')
  }
  const db = readDb()
  const sentence = requireSentence(db, sentenceId)
  sentence.proficiency = proficiency
  writeDb(db)
  return sentence
}

// 최근 발화 1개만 저장하고 덮어쓴다.
export async function setTranscript(sentenceId, transcript) {
  const db = readDb()
  const sentence = requireSentence(db, sentenceId)
  sentence.last_transcript = transcript ?? ''
  writeDb(db)
  return sentence
}

// ---- 화면 상태(다이얼 중앙 문장) ----
// 폴더별로 마지막에 보던 중앙 문장 id를 기억한다. 다른 폴더에 다녀오거나 새로고침·재접속을 해도
// 처음(1번)이 아니라 보던 문장부터 이어보게 하기 위해서다. 존재 여부는 확인하지 않는다(문장이
// 삭제됐으면 호출한 쪽이 알아서 가까운 문장으로 대체한다).
export async function getCenterSentence(folderId) {
  return readCenterDb()[folderId] ?? null
}

export async function setCenterSentence(folderId, sentenceId) {
  const db = readCenterDb()
  db[folderId] = sentenceId
  writeCenterDb(db)
}
