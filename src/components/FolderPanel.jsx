import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, FolderOpen, Trash2 } from 'lucide-react'
import { useFolders } from '../hooks/FoldersContext.jsx'
import Overlay from './Overlay.jsx'

// 폴더 패널 — 메인 화면 위에 열리는 오버레이. 생성/목록/삭제/선택.
export default function FolderPanel({ currentFolderId, suffix = '', onClose }) {
  const { folders, createFolder, deleteFolder } = useFolders()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await createFolder(name)
      setName('')
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(folder) {
    const ok = window.confirm(
      `"${folder.name}" 폴더와 안의 문장 ${folder.sentenceCount}개를 함께 삭제할까요?`,
    )
    if (!ok) return
    try {
      await deleteFolder(folder.id)
      setError('')
      // 현재 폴더를 지웠으면 화면이 남은 첫 폴더(없으면 빈 상태)로 알아서 전환한다.
    } catch (err) {
      setError(err.message)
    }
  }

  function handleSelect(folder) {
    navigate(`/folders/${folder.id}${suffix}`)
    onClose()
  }

  return (
    <Overlay title="폴더" side="right" onClose={onClose}>
      <form className="row" onSubmit={handleCreate}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새 폴더 이름"
          aria-label="새 폴더 이름"
        />
        <button type="submit" className="primary">
          만들기
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <h3 className="panel-section-title">폴더 목록</h3>
      {folders.length === 0 ? (
        <p className="muted">폴더가 없습니다. 이름을 입력해 폴더를 만들어 주세요.</p>
      ) : (
        <ul className="folder-list">
          {folders.map((f) => (
            <li key={f.id} className={f.id === currentFolderId ? 'current' : ''}>
              <button type="button" className="folder-select" onClick={() => handleSelect(f)}>
                {f.id === currentFolderId ? <FolderOpen size={18} aria-hidden="true" /> : <Folder size={18} aria-hidden="true" />}
                <span>{f.name}</span>
                <span className="folder-count">{f.sentenceCount}문장</span>
              </button>
              <button
                type="button"
                className="ghost danger icon"
                onClick={() => handleDelete(f)}
                aria-label={`${f.name} 폴더 삭제`}
                title="삭제"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Overlay>
  )
}
