import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'
import Carousel from '../components/Carousel.jsx'
import TopBar from '../components/TopBar.jsx'
import { useCenter } from '../hooks/CenterContext.jsx'
import { useCurrentFolder } from '../hooks/useCurrentFolder.js'

// 메인 화면 — 연습 (/, /folders/:folderId)
export default function PracticePage() {
  const { folderId, folder, folders, loaded } = useCurrentFolder()
  const { setCenter } = useCenter()
  const location = useLocation()
  const navigate = useNavigate()
  const [folderOpen, setFolderOpen] = useState(false)
  const noFolders = loaded && folders.length === 0

  // 문장 표 화면에서 행을 눌러 왔으면 그 문장을 중앙에 두고, 새로고침 때 반복되지 않게 state를 지운다.
  const centerSentenceId = location.state?.centerSentenceId
  useEffect(() => {
    if (!centerSentenceId || !folderId) return
    setCenter(folderId, centerSentenceId)
    navigate(location.pathname, { replace: true, state: null })
  }, [centerSentenceId, folderId, setCenter, navigate, location.pathname])

  // 폴더가 하나도 없으면 폴더 패널을 자동으로 연다.
  useEffect(() => {
    if (noFolders) setFolderOpen(true)
  }, [noFolders])

  if (!loaded) return null
  // 첫 진입(/), 없는 폴더 id, 현재 폴더 삭제 → 가장 먼저 만든 폴더로
  if (!folder && folders.length > 0) return <Navigate to={`/folders/${folders[0].id}`} replace />
  if (!folder && folderId) return <Navigate to="/" replace />

  return (
    <main>
      <TopBar view="practice" folder={folder} folderOpen={folderOpen} onFolderOpenChange={setFolderOpen} />

      {folder ? (
        <Carousel key={folder.id} folderId={folder.id} />
      ) : (
        <div className="state-card">
          <FolderOpen size={28} aria-hidden="true" />
          <p>폴더를 만들어 주세요.</p>
          <button type="button" className="primary" onClick={() => setFolderOpen(true)}>
            폴더 패널 열기
          </button>
        </div>
      )}
    </main>
  )
}
