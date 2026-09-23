import { useParams } from 'react-router-dom'
import { useFolders } from './FoldersContext.jsx'

// 현재 폴더는 URL(:folderId)이 기준이다. URL의 id가 없거나 존재하지 않으면 folder는 null.
export function useCurrentFolder() {
  const { folderId } = useParams()
  const { folders, loaded } = useFolders()
  const folder = folders.find((f) => f.id === folderId) ?? null
  return { folderId, folder, folders, loaded }
}
