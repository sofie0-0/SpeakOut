import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as storage from '../storage/index.js'

// 폴더 목록(문장 수 포함)을 앱 전체가 공유한다. 저장소를 바꾸는 동작은 반드시 여기를 거쳐
// 목록이 갱신되게 한다. version은 문장이 바뀔 때마다 늘어나서 화면이 문장을 다시 읽는 신호로 쓴다.
const FoldersContext = createContext(null)

export function FoldersProvider({ children }) {
  const [folders, setFolders] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(async () => {
    const list = await storage.listFolders()
    const withCounts = await Promise.all(
      list.map(async (f) => ({ ...f, sentenceCount: await storage.countSentences(f.id) })),
    )
    setFolders(withCounts)
    setLoaded(true)
    setVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      folders,
      loaded,
      version,
      refresh,
      async createFolder(name) {
        const folder = await storage.createFolder(name)
        await refresh()
        return folder
      },
      async deleteFolder(folderId) {
        await storage.deleteFolder(folderId)
        await refresh()
      },
      // 직접 입력 한 건. en/ko가 둘 다 비면 StorageError.
      async addSentence(folderId, input) {
        const sentence = await storage.addSentence(folderId, input)
        await refresh()
        return sentence
      },
      // CSV 등 여러 건. { added, skipped }
      async addSentences(folderId, items) {
        const result = await storage.addSentences(folderId, items)
        await refresh()
        return result
      },
      // en/ko만 수정. 둘 다 비면 StorageError.
      async updateSentence(sentenceId, input) {
        const sentence = await storage.updateSentence(sentenceId, input)
        await refresh()
        return sentence
      },
      // 숙련도(0/1/2)를 즉시 저장한다.
      async setProficiency(sentenceId, proficiency) {
        const sentence = await storage.setProficiency(sentenceId, proficiency)
        await refresh()
        return sentence
      },
      // 최근 발화를 저장한다(덮어쓰기).
      async setTranscript(sentenceId, transcript) {
        const sentence = await storage.setTranscript(sentenceId, transcript)
        await refresh()
        return sentence
      },
      // 삭제 후 뒤 문장의 번호가 당겨진다.
      async deleteSentence(sentenceId) {
        await storage.deleteSentence(sentenceId)
        await refresh()
      },
    }),
    [folders, loaded, version, refresh],
  )

  return <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>
}

export function useFolders() {
  const ctx = useContext(FoldersContext)
  if (!ctx) throw new Error('useFolders는 FoldersProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
