import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import * as storage from '../storage/index.js'

// 폴더별 "중앙 문장 id"를 기억한다. 문장 표 화면에 다녀오거나 다른 폴더에 갔다 와도, 새로고침·
// 사이트를 껐다 다시 들어와도 이전 중앙 문장이 유지되게 하기 위해서다.
// position이 아니라 id로 잡는다(삭제 후 번호가 바뀌므로). 실제 값은 storage(localStorage)에
// 폴더별로 저장해 두고, 메모리(centers)는 그 값을 읽어 온 캐시로 쓴다.
const CenterContext = createContext(null)

export function CenterProvider({ children }) {
  const [centers, setCenters] = useState({})
  const [loadedFolders, setLoadedFolders] = useState(() => new Set())
  const pending = useRef(new Set())

  const setCenter = useCallback((folderId, sentenceId) => {
    setCenters((prev) => (prev[folderId] === sentenceId ? prev : { ...prev, [folderId]: sentenceId }))
    storage.setCenterSentence(folderId, sentenceId).catch(() => {})
  }, [])

  // 폴더에 처음 들어올 때 저장된 중앙 문장 id를 한 번 읽어 온다(폴더당 한 번).
  const ensureLoaded = useCallback((folderId) => {
    if (!folderId || loadedFolders.has(folderId) || pending.current.has(folderId)) return
    pending.current.add(folderId)
    storage
      .getCenterSentence(folderId)
      .then((sentenceId) => {
        if (sentenceId) {
          setCenters((prev) => (prev[folderId] !== undefined ? prev : { ...prev, [folderId]: sentenceId }))
        }
      })
      .catch(() => {})
      .finally(() => {
        pending.current.delete(folderId)
        setLoadedFolders((prev) => (prev.has(folderId) ? prev : new Set(prev).add(folderId)))
      })
  }, [loadedFolders])

  const isCenterLoaded = useCallback((folderId) => loadedFolders.has(folderId), [loadedFolders])

  const value = useMemo(
    () => ({ centers, setCenter, ensureLoaded, isCenterLoaded }),
    [centers, setCenter, ensureLoaded, isCenterLoaded],
  )
  return <CenterContext.Provider value={value}>{children}</CenterContext.Provider>
}

export function useCenter() {
  const ctx = useContext(CenterContext)
  if (!ctx) throw new Error('useCenter는 CenterProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
