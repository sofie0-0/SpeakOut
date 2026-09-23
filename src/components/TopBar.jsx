import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Folder, Mic, Plus, Table2, LayoutList } from 'lucide-react'
import AddSentencePanel from './AddSentencePanel.jsx'
import FolderPanel from './FolderPanel.jsx'

// 두 화면 공통 맨 윗줄: 폴더 선택, 화면 전환 버튼, 문장 추가, 앱 이름.
// view: 'practice'(연습 화면) | 'table'(문장 표 화면). 폴더 패널은 부모가 강제로 열 수 있다(폴더 없음).
export default function TopBar({ view, folder, folderOpen, onFolderOpenChange }) {
  const [addOpen, setAddOpen] = useState(false)
  const isTable = view === 'table'

  return (
    <>
      <header className="topbar">
        <div className="topbar-actions">
          <button type="button" className="folder-chip" onClick={() => onFolderOpenChange(true)}>
            <Folder size={16} aria-hidden="true" />
            <span>{folder ? folder.name : '폴더 없음'}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {folder && (
            <Link className="button" to={isTable ? `/folders/${folder.id}` : `/folders/${folder.id}/table`}>
              {isTable ? <LayoutList size={16} aria-hidden="true" /> : <Table2 size={16} aria-hidden="true" />}
              {/* 좁은 화면에서는 이 글자만 숨기고 아이콘만 남긴다(topbar.css) */}
              <span className="label-text">{isTable ? '연습 화면 보기' : '문장 표 보기'}</span>
            </Link>
          )}
          {folder && (
            <button type="button" className="primary icon" onClick={() => setAddOpen(true)} aria-label="문장 추가" title="문장 추가">
              <Plus size={18} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="brand">
          <span className="brand-mark">
            <Mic size={16} aria-hidden="true" />
          </span>
          영어 말하기 연습
        </div>
      </header>

      {folderOpen && (
        <FolderPanel
          currentFolderId={folder?.id}
          suffix={isTable ? '/table' : ''}
          onClose={() => onFolderOpenChange(false)}
        />
      )}
      {addOpen && <AddSentencePanel defaultFolderId={folder?.id} onClose={() => setAddOpen(false)} />}
    </>
  )
}
