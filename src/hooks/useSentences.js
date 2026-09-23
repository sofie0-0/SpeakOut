import { useEffect, useState } from 'react'
import * as storage from '../storage/index.js'
import { useFolders } from './FoldersContext.jsx'

// 폴더의 문장을 번호순으로 읽는다. 문장이 바뀌면(FoldersContext의 version) 다시 읽는다.
export function useSentences(folderId) {
  const { version } = useFolders()
  const [sentences, setSentences] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!folderId) return undefined
    storage.listSentences(folderId).then((list) => {
      if (cancelled) return
      setSentences(list)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [folderId, version])

  return { sentences, loaded }
}
