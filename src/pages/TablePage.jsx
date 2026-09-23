import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import ProficiencyFilter from '../components/ProficiencyFilter.jsx'
import SentenceTable from '../components/SentenceTable.jsx'
import TopBar from '../components/TopBar.jsx'
import { useFilter } from '../hooks/FilterContext.jsx'
import { useFolders } from '../hooks/FoldersContext.jsx'
import { useCurrentFolder } from '../hooks/useCurrentFolder.js'
import { useSentences } from '../hooks/useSentences.js'
import { filterSentences, sortByPosition, sortByProficiency } from '../utils/filter.js'

// 문장 표 화면 (/folders/:folderId/table)
export default function TablePage() {
  const { folder, loaded } = useCurrentFolder()
  const { updateSentence, deleteSentence } = useFolders()
  const { filter } = useFilter()
  const { sentences } = useSentences(folder?.id)
  const navigate = useNavigate()
  const [folderOpen, setFolderOpen] = useState(false)
  const [sort, setSort] = useState('position') // 이 화면에만 적용. 저장하지 않는다.

  const rows = useMemo(() => {
    const filtered = filterSentences(sentences, filter)
    return sort === 'proficiency' ? sortByProficiency(filtered) : sortByPosition(filtered)
  }, [sentences, filter, sort])

  if (!loaded) return null
  if (!folder) return <Navigate to="/" replace />

  // 메인 화면이 state의 centerSentenceId 문장을 중앙에 놓는다(4단계).
  function goToSentence(sentence) {
    navigate(`/folders/${folder.id}`, { state: { centerSentenceId: sentence.id } })
  }

  return (
    <main className="table-page">
      <TopBar view="table" folder={folder} folderOpen={folderOpen} onFolderOpenChange={setFolderOpen} />

      <div className="toolbar">
        <div className="toolbar-left">
          <ProficiencyFilter />
          <span className="count-chip">{folder.sentenceCount}개 문장</span>
        </div>
        <label className="sort">
          정렬
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="position">번호순</option>
            <option value="proficiency">숙련도순</option>
          </select>
        </label>
      </div>

      {folder.sentenceCount === 0 ? (
        <div className="state-card">
          <Inbox size={28} aria-hidden="true" />
          <p>문장이 없습니다. + 버튼으로 추가하세요.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="state-card">
          <Inbox size={28} aria-hidden="true" />
          <p>조건에 맞는 문장이 없습니다.</p>
        </div>
      ) : (
        <SentenceTable
          sentences={rows}
          onSelect={goToSentence}
          onUpdate={(id, input) => updateSentence(id, input)}
          onDelete={(id) => deleteSentence(id)}
        />
      )}
    </main>
  )
}
