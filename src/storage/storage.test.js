import { describe, expect, it } from 'vitest'
import {
  StorageErrorCode,
  addSentence,
  addSentences,
  countSentences,
  createFolder,
  deleteFolder,
  deleteSentence,
  listFolders,
  listSentences,
  setProficiency,
  setTranscript,
  updateSentence,
} from './index.js'

const codeOf = async (promise) => {
  try {
    await promise
  } catch (e) {
    return e.code
  }
  return null
}

const seed = async (n = 3) => {
  const folder = await createFolder('A')
  await addSentences(folder.id, Array.from({ length: n }, (_, i) => ({ en: `en${i + 1}`, ko: `ko${i + 1}` })))
  return folder
}

describe('폴더', () => {
  it('앞뒤 공백을 제거하고 만든 순서대로 나열한다', async () => {
    const a = await createFolder('  A  ')
    const b = await createFolder('B')
    expect(a.name).toBe('A')
    expect(typeof a.id).toBe('string')
    expect(await listFolders()).toEqual([a, b])
  })
  it('빈 이름과 중복 이름을 거부한다', async () => {
    await createFolder('A')
    expect(await codeOf(createFolder('   '))).toBe(StorageErrorCode.EMPTY_FOLDER_NAME)
    expect(await codeOf(createFolder(' A '))).toBe(StorageErrorCode.DUPLICATE_FOLDER_NAME)
    expect(await listFolders()).toHaveLength(1)
  })
  it('삭제하면 안의 문장도 함께 삭제되고 다른 폴더는 그대로다', async () => {
    const a = await seed(2)
    const b = await createFolder('B')
    await addSentences(b.id, [{ en: 'x', ko: '' }])
    await deleteFolder(a.id)
    expect(await listFolders()).toEqual([b])
    expect(await listSentences(a.id)).toEqual([])
    expect(await countSentences(b.id)).toBe(1)
  })
  it('없는 폴더 삭제는 오류', async () => {
    expect(await codeOf(deleteFolder('nope'))).toBe(StorageErrorCode.FOLDER_NOT_FOUND)
  })
})

describe('문장 추가', () => {
  it('맨 뒤부터 position을 부여하고 기본값을 채운다', async () => {
    const f = await seed(2)
    const { added, skipped } = await addSentences(f.id, [
      { en: 'x', ko: 'y', last_transcript: 'said' },
      { en: 'z', ko: '' },
    ])
    expect(skipped).toBe(0)
    expect(added.map((s) => s.position)).toEqual([3, 4])
    expect(added[0]).toMatchObject({ folder_id: f.id, en: 'x', ko: 'y', proficiency: 0, last_transcript: 'said' })
    expect(added[1].last_transcript).toBe('')
    expect((await listSentences(f.id)).map((s) => s.position)).toEqual([1, 2, 3, 4])
  })
  it('폴더별로 position이 독립적이다', async () => {
    const a = await seed(2)
    const b = await createFolder('B')
    const { added } = await addSentences(b.id, [{ en: 'x', ko: '' }])
    expect(added[0].position).toBe(1)
    expect(await countSentences(a.id)).toBe(2)
  })
  it('중복 영어 문장을 허용하고 id는 서로 다르다', async () => {
    const f = await createFolder('A')
    const { added } = await addSentences(f.id, [
      { en: 'Hi', ko: '' },
      { en: 'Hi', ko: '' },
    ])
    expect(added).toHaveLength(2)
    expect(added[0].id).not.toBe(added[1].id)
  })
  it('en/ko가 둘 다 빈 항목은 건너뛰고 번호는 빈틈이 없다', async () => {
    const f = await createFolder('A')
    const { added, skipped } = await addSentences(f.id, [
      { en: '', ko: ' ' },
      { en: 'a', ko: '' },
      { en: '', ko: '' },
      { ko: 'b' },
    ])
    expect(skipped).toBe(2)
    expect(added.map((s) => s.position)).toEqual([1, 2])
  })
  it('없는 폴더에는 추가할 수 없다', async () => {
    expect(await codeOf(addSentences('nope', [{ en: 'a', ko: '' }]))).toBe(StorageErrorCode.FOLDER_NOT_FOUND)
  })
  it('addSentence는 하나만 있어도 되고 둘 다 비면 거부한다', async () => {
    const f = await createFolder('A')
    expect((await addSentence(f.id, { en: '', ko: '안녕' })).ko).toBe('안녕')
    expect(await codeOf(addSentence(f.id, { en: ' ', ko: '' }))).toBe(StorageErrorCode.EMPTY_SENTENCE)
    expect(await countSentences(f.id)).toBe(1)
  })
})

describe('문장 수정·삭제', () => {
  it('수정해도 숙련도와 발화는 유지된다', async () => {
    const f = await seed(1)
    const [s] = await listSentences(f.id)
    await setProficiency(s.id, 2)
    await setTranscript(s.id, 'my speech')
    await updateSentence(s.id, { en: '  new en ', ko: '' })
    expect((await listSentences(f.id))[0]).toMatchObject({
      en: 'new en',
      ko: '',
      proficiency: 2,
      last_transcript: 'my speech',
      position: 1,
    })
  })
  it('수정 시 en/ko가 둘 다 비면 거부하고 원본을 유지한다', async () => {
    const f = await seed(1)
    const [s] = await listSentences(f.id)
    expect(await codeOf(updateSentence(s.id, { en: ' ', ko: '' }))).toBe(StorageErrorCode.EMPTY_SENTENCE)
    expect((await listSentences(f.id))[0].en).toBe('en1')
  })
  it('삭제하면 뒤 문장의 position이 하나씩 당겨지고 id는 유지된다', async () => {
    const f = await seed(4)
    const before = await listSentences(f.id)
    await deleteSentence(before[1].id)
    const after = await listSentences(f.id)
    expect(after.map((s) => [s.id, s.position])).toEqual([
      [before[0].id, 1],
      [before[2].id, 2],
      [before[3].id, 3],
    ])
  })
  it('첫/마지막 문장 삭제도 빈틈이 없다', async () => {
    const f = await seed(3)
    let list = await listSentences(f.id)
    await deleteSentence(list[0].id)
    list = await listSentences(f.id)
    await deleteSentence(list[list.length - 1].id)
    expect((await listSentences(f.id)).map((s) => s.position)).toEqual([1])
  })
  it('다른 폴더의 position은 건드리지 않는다', async () => {
    const a = await seed(2)
    const b = await createFolder('B')
    await addSentences(b.id, [
      { en: 'x', ko: '' },
      { en: 'y', ko: '' },
    ])
    await deleteSentence((await listSentences(a.id))[0].id)
    expect((await listSentences(b.id)).map((s) => s.position)).toEqual([1, 2])
  })
  it('삭제 중 저장이 실패하면 아무것도 바뀌지 않는다', async () => {
    const f = await seed(3)
    const before = await listSentences(f.id)
    const original = localStorage.setItem
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    try {
      await expect(deleteSentence(before[0].id)).rejects.toThrow('QuotaExceededError')
    } finally {
      localStorage.setItem = original
    }
    expect(await listSentences(f.id)).toEqual(before)
  })
  it('없는 문장은 오류', async () => {
    expect(await codeOf(deleteSentence('nope'))).toBe(StorageErrorCode.SENTENCE_NOT_FOUND)
    expect(await codeOf(updateSentence('nope', { en: 'a', ko: '' }))).toBe(StorageErrorCode.SENTENCE_NOT_FOUND)
  })
})

describe('숙련도·발화', () => {
  it('숙련도는 0/1/2만 받고 저장이 유지된다', async () => {
    const f = await seed(1)
    const [s] = await listSentences(f.id)
    await setProficiency(s.id, 1)
    expect((await listSentences(f.id))[0].proficiency).toBe(1)
    expect(await codeOf(setProficiency(s.id, 3))).toBe(StorageErrorCode.INVALID_PROFICIENCY)
    expect(await codeOf(setProficiency(s.id, '1'))).toBe(StorageErrorCode.INVALID_PROFICIENCY)
    expect((await listSentences(f.id))[0].proficiency).toBe(1)
  })
  it('발화는 최근 1개만 남고 덮어쓴다', async () => {
    const f = await seed(1)
    const [s] = await listSentences(f.id)
    await setTranscript(s.id, 'first')
    await setTranscript(s.id, 'second')
    expect((await listSentences(f.id))[0].last_transcript).toBe('second')
  })
})

describe('저장 데이터 복원', () => {
  it('깨진 JSON이 있어도 빈 상태로 동작한다', async () => {
    localStorage.setItem('english-study-app:v1', '{broken')
    expect(await listFolders()).toEqual([])
    expect((await createFolder('A')).name).toBe('A')
  })
})
